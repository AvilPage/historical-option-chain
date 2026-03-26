function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}


function isWeekday(dateStr) {
  const day = new Date(`${dateStr}T00:00:00`).getDay()
  return day !== 0 && day !== 6
}

function formatDateLocal(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPreviousWeekdayRelativeToToday(dates, now = new Date()) {
  const target = new Date(now)
  target.setHours(0, 0, 0, 0)
  target.setDate(target.getDate() - 1)

  while (target.getDay() === 0 || target.getDay() === 6) {
    target.setDate(target.getDate() - 1)
  }

  const targetStr = formatDateLocal(target)

  for (let i = dates.length - 1; i >= 0; i -= 1) {
    if (dates[i] <= targetStr && isWeekday(dates[i])) {
      return dates[i]
    }
  }

  return dates.find((dateStr) => isWeekday(dateStr)) || ''
}

export function getWeekdayDates(dates) {
  return dates.filter((dateStr) => {
    return isWeekday(dateStr)
  })
}

export function buildOptionData(rows, symbol, date, selectedExpiry) {
  const expiryDates = Array.from(new Set(rows.map((row) => row.XpryDt).filter(Boolean))).sort()
  const expiry = selectedExpiry && expiryDates.includes(selectedExpiry) ? selectedExpiry : (expiryDates[0] || '')

  const filtered = rows.filter((row) => row.XpryDt === expiry && (row.OptnTp === 'CE' || row.OptnTp === 'PE'))
  const strikeMap = new Map()

  filtered.forEach((row) => {
    const strike = toNumber(row.StrkPric)
    if (strike <= 0) return

    if (!strikeMap.has(strike)) {
      strikeMap.set(strike, {
        strike,
        call: { ltp: 0, change: 0, oi: 0, iv: '-', delta: 0, gamma: 0, theta: 0, vega: 0 },
        put: { ltp: 0, change: 0, oi: 0, iv: '-', delta: 0, gamma: 0, theta: 0, vega: 0 },
      })
    }

    const last = toNumber(row.LastPric || row.ClsPric)
    const prev = toNumber(row.PrvsClsgPric)
    const change = prev !== 0 ? ((last - prev) / prev) * 100 : 0
    const side = row.OptnTp === 'CE' ? 'call' : 'put'

    strikeMap.get(strike)[side] = {
      ltp: last,
      change,
      oi: toNumber(row.OpnIntrst),
      iv: '-',
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
    }
  })

  const strikes = Array.from(strikeMap.values()).sort((a, b) => a.strike - b.strike)
  const currentPrice = toNumber(rows[0]?.UndrlygPric)

  return {
    symbol,
    currentPrice,
    changePercent: 0,
    expiry,
    expiryDates,
    lastUpdated: date,
    strikes,
  }
}

export function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name) || ''
}

export function getChangeClass(change) {
  if (change > 0) return 'positive'
  if (change < 0) return 'negative'
  return ''
}

export function formatNumber(num) {
  return num?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatLargeNumber(num) {
  if (num >= 10000000) return (num / 10000000).toFixed(2) + 'Cr'
  if (num >= 100000) return (num / 100000).toFixed(2) + 'L'
  return num?.toLocaleString('en-IN')
}

export function isAtmStrike(strike, atmStrike) {
  return strike === atmStrike
}

export function isItmStrike(strike, type, currentPrice) {
  if (type === 'call') return strike < currentPrice
  return strike > currentPrice
}
