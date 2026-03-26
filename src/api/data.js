const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'AvilPage'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'historical-option-chain-data'
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'master'
const GITHUB_BASE_PATH = import.meta.env.VITE_GITHUB_FO_PATH || 'data/fo'

export const DEFAULT_DATE = import.meta.env.VITE_DEFAULT_DATE || '2025-01-01'
export const DEFAULT_SYMBOL = import.meta.env.VITE_DEFAULT_SYMBOL || 'NIFTY'

const CACHE_NAME = 'option-chain-v1'

function toContentsUrl(path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
}

function toRawCsvUrl(date, symbol) {
  const encodedPath = `${GITHUB_BASE_PATH}/${date}/${symbol}.csv`.split('/').map(encodeURIComponent).join('/')
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${encodeURIComponent(GITHUB_BRANCH)}/${encodedPath}`
}

async function cachedFetch(url) {
  if ('caches' in window) {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(url)
    if (cached) return cached

    const fresh = await fetch(url)
    if (fresh.ok) cache.put(url, fresh.clone())
    return fresh
  }

  return fetch(url)
}

async function fetchJson(url) {
  const response = await cachedFetch(url)
  if (!response.ok) {
    let message = ''

    try {
      const errorBody = await response.json()
      message = errorBody?.message || ''
    } catch {
      // Ignore JSON parse errors on non-JSON responses.
    }

    const err = new Error(`GitHub API request failed (${response.status})${message ? `: ${message}` : ''}`)
    err.status = response.status
    err.isRateLimit = response.status === 403
      && (response.headers.get('x-ratelimit-remaining') === '0' || /rate\s*limit/i.test(message))
    throw err
  }

  return response.json()
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }

    cur += ch
  }

  out.push(cur)
  return out
}

function parseCsv(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean)
  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    return row
  })
}

export function isRateLimitError(err) {
  return Boolean(err?.isRateLimit)
}

export async function fetchAvailableDates() {
  const items = await fetchJson(toContentsUrl(GITHUB_BASE_PATH))

  return items
    .filter((item) => item.type === 'dir' && /^\d{4}-\d{2}-\d{2}$/.test(item.name))
    .map((item) => item.name)
    .sort()
}

export async function fetchAvailableSymbols(date) {
  const items = await fetchJson(toContentsUrl(`${GITHUB_BASE_PATH}/${date}`))

  return items
    .filter((item) => item.type === 'file' && item.name.endsWith('.csv'))
    .map((item) => item.name.replace(/\.csv$/i, ''))
    .sort()
}

export async function fetchOptionCsvRows(date, symbol) {
  let csvUrl = toRawCsvUrl(date, symbol)
  let usedRawFallback = false

  try {
    const fileMeta = await fetchJson(toContentsUrl(`${GITHUB_BASE_PATH}/${date}/${symbol}.csv`))
    csvUrl = fileMeta?.download_url || csvUrl
  } catch (err) {
    if (!isRateLimitError(err)) {
      throw err
    }

    usedRawFallback = true
  }

  const response = await cachedFetch(csvUrl)
  if (!response.ok) {
    throw new Error(`CSV download failed (${response.status})`)
  }

  const text = await response.text()

  return {
    rows: parseCsv(text),
    usedRawFallback,
  }
}
