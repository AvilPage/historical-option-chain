import { useState, useEffect, useRef, useMemo } from 'react'
import './HistoricalOptionChain.css'

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'AvilPage'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'historical-option-chain-data'
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'master'
const GITHUB_BASE_PATH = import.meta.env.VITE_GITHUB_FO_PATH || 'data/fo'
const DEFAULT_DATE = import.meta.env.VITE_DEFAULT_DATE || '2025-01-01'
const DEFAULT_SYMBOL = import.meta.env.VITE_DEFAULT_SYMBOL || 'NIFTY'

function toContentsUrl(path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
}

function toRawCsvUrl(date, symbol) {
  const encodedPath = `${GITHUB_BASE_PATH}/${date}/${symbol}.csv`.split('/').map(encodeURIComponent).join('/')
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${encodeURIComponent(GITHUB_BRANCH)}/${encodedPath}`
}

async function fetchJson(url) {
  const response = await fetch(url)
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

function isRateLimitError(err) {
  return Boolean(err?.isRateLimit)
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

function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function getLastWeekday(dates) {
  for (let i = dates.length - 1; i >= 0; i -= 1) {
    const day = new Date(`${dates[i]}T00:00:00`).getDay()
    if (day !== 0 && day !== 6) {
      return dates[i]
    }
  }
  return dates[dates.length - 1] || ''
}

function getWeekdayDates(dates) {
  return dates.filter((dateStr) => {
    const day = new Date(`${dateStr}T00:00:00`).getDay()
    return day !== 0 && day !== 6
  })
}

function buildOptionData(rows, symbol, date, selectedExpiry) {
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

function HistoricalOptionChain() {
  const [availableDates, setAvailableDates] = useState([])
  const [availableSymbols, setAvailableSymbols] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_SYMBOL)
  const [selectedExpiry, setSelectedExpiry] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [viewMode, setViewMode] = useState('ltp')
  const [csvRows, setCsvRows] = useState([])
  const [atmStrike, setAtmStrike] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const [showToastFlag, setShowToastFlag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const atmRowRef = useRef(null)

  const weekdayDates = useMemo(() => getWeekdayDates(availableDates), [availableDates])

  const optionData = useMemo(
    () => buildOptionData(csvRows, selectedSymbol, selectedDate, selectedExpiry),
    [csvRows, selectedSymbol, selectedDate, selectedExpiry],
  )

  useEffect(() => {
    let ignore = false

    async function loadDates() {
      setLoading(true)
      setError('')
      try {
        const items = await fetchJson(toContentsUrl(GITHUB_BASE_PATH))
        const dates = items
          .filter((item) => item.type === 'dir' && /^\d{4}-\d{2}-\d{2}$/.test(item.name))
          .map((item) => item.name)
          .sort()

        if (!ignore) {
          setAvailableDates(dates)
          setSelectedDate((prev) => {
            if (prev && dates.includes(prev)) return prev
            if (dates.includes(DEFAULT_DATE)) return DEFAULT_DATE
            return getLastWeekday(dates)
          })
        }
      } catch (err) {
        if (!ignore) {
          if (isRateLimitError(err)) {
            setAvailableDates((prev) => (prev.length ? prev : [DEFAULT_DATE]))
            setSelectedDate((prev) => prev || DEFAULT_DATE)
            showToast('GitHub API rate limit hit. Using fallback date list.')
          } else {
            setError(err.message || 'Failed to load dates from GitHub')
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadDates()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!selectedDate) return

    let ignore = false

    async function loadSymbols() {
      setLoading(true)
      setError('')
      try {
        const items = await fetchJson(toContentsUrl(`${GITHUB_BASE_PATH}/${selectedDate}`))
        const symbols = items
          .filter((item) => item.type === 'file' && item.name.endsWith('.csv'))
          .map((item) => item.name.replace(/\.csv$/i, ''))
          .sort()

        if (!ignore) {
          setAvailableSymbols(symbols)
          setSelectedSymbol((prev) => {
            if (prev && symbols.includes(prev)) return prev
            if (symbols.includes(DEFAULT_SYMBOL)) return DEFAULT_SYMBOL
            return symbols[0] || ''
          })
        }
      } catch (err) {
        if (!ignore) {
          if (isRateLimitError(err)) {
            setAvailableSymbols((prev) => (prev.length ? prev : [selectedSymbol || DEFAULT_SYMBOL]))
            setSelectedSymbol((prev) => prev || DEFAULT_SYMBOL)
            showToast('GitHub API rate limit hit. Using fallback symbol list.')
          } else {
            setAvailableSymbols([])
            setSelectedSymbol('')
            setError(err.message || 'Failed to load symbols from GitHub')
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSymbols()
    return () => {
      ignore = true
    }
  }, [selectedDate])

  useEffect(() => {
    if (!selectedDate || !selectedSymbol) return

    let ignore = false

    async function loadCsvRows() {
      setLoading(true)
      setError('')
      try {
        let csvUrl = toRawCsvUrl(selectedDate, selectedSymbol)
        let metaError = null
        let fileMeta = null

        try {
          fileMeta = await fetchJson(toContentsUrl(`${GITHUB_BASE_PATH}/${selectedDate}/${selectedSymbol}.csv`))
        } catch (err) {
          metaError = err
        }

        if (metaError) {
          if (metaError.isRateLimit) {
            if (!ignore) {
              showToast('GitHub API rate limit hit. Using raw CSV endpoint.')
            }
          } else {
            if (!ignore) {
              setCsvRows([])
              setError(metaError.message || 'Failed to load option CSV')
            }
            return
          }
        } else {
          csvUrl = fileMeta?.download_url || csvUrl
        }

        const response = await fetch(csvUrl)
        if (!response.ok) {
          if (!ignore) {
            setCsvRows([])
            setError(`CSV download failed (${response.status})`)
          }
          return
        }
        const text = await response.text()
        const rows = parseCsv(text)

        if (!ignore) {
          setCsvRows(rows)
          const nextExpiry = buildOptionData(rows, selectedSymbol, selectedDate, selectedExpiry).expiry
          setSelectedExpiry(nextExpiry)
        }
      } catch (err) {
        if (!ignore) {
          setCsvRows([])
          setError(err.message || 'Failed to load option CSV')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadCsvRows()
    return () => {
      ignore = true
    }
  }, [selectedDate, selectedSymbol])

  useEffect(() => {
    if (!optionData.strikes.length) {
      setAtmStrike(0)
      return
    }

    const currentPrice = optionData.currentPrice
    const closest = optionData.strikes.reduce((prev, curr) =>
      Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice) ? curr : prev
    )
    setAtmStrike(closest.strike)
  }, [optionData])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (atmRowRef.current) {
        atmRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [atmStrike])

  function isAtm(strike) {
    return strike === atmStrike
  }

  function isItm(strike, type) {
    if (type === 'call') return strike < optionData.currentPrice
    return strike > optionData.currentPrice
  }

  function formatNumber(num) {
    return num?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function formatLargeNumber(num) {
    if (num >= 10000000) return (num / 10000000).toFixed(2) + 'Cr'
    if (num >= 100000) return (num / 100000).toFixed(2) + 'L'
    return num?.toLocaleString('en-IN')
  }

  function getChangeClass(change) {
        if (change > 0) return 'positive'
        if (change < 0) return 'negative'
        return ''
      }

      function showToast(message) {
        setToastMessage(message)
        setShowToastFlag(true)
        setTimeout(() => {
          setShowToastFlag(false)
        }, 3000)
      }

      function goToPreviousDate() {
        if (!weekdayDates.length) {
          showToast('No weekday dates available')
          return
        }

        const index = weekdayDates.indexOf(selectedDate)
        if (index === -1) {
          const candidate = [...weekdayDates].reverse().find((date) => date < selectedDate)
          if (!candidate) {
            showToast('No older weekday available')
            return
          }
          setSelectedDate(candidate)
          return
        }

        if (index <= 0) {
          showToast('No older date available')
          return
        }
        setSelectedDate(weekdayDates[index - 1])
      }

      function goToNextDate() {
        if (!weekdayDates.length) {
          showToast('No weekday dates available')
          return
        }

        const index = weekdayDates.indexOf(selectedDate)
        if (index === -1) {
          const candidate = weekdayDates.find((date) => date > selectedDate)
          if (!candidate) {
            showToast("You can't travel to the future! 🚀")
            return
          }
          setSelectedDate(candidate)
          return
        }

        if (index >= weekdayDates.length - 1) {
          showToast("You can't travel to the future! 🚀")
          return
        }

        setSelectedDate(weekdayDates[index + 1])
      }

      return (
        <div className="option-chain-container">
          {/* Header Controls */}
          <div className="header">
            <div className="symbol-info">
              <div className="symbol-selector">
                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
                  {availableSymbols.map((symbol) => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
                <div className="current-price">
                  <span className="price">{formatNumber(optionData.currentPrice)}</span>
                  <span className={`change ${getChangeClass(optionData.changePercent)}`}>
                    {optionData.changePercent > 0 ? '+' : ''}{optionData.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="expiry-selector">
                <label>Expiry:</label>
                <select value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)}>
                  {optionData.expiryDates.map((expiry) => (
                    <option key={expiry} value={expiry}>
                      {new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="date-selector">
                <label>Date:</label>
                <button className="date-nav-btn" onClick={goToPreviousDate} title="Previous Day">◀</button>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                <button className="date-nav-btn" onClick={goToNextDate} title="Next Day">▶</button>
              </div>
            </div>

            <div className="view-toggle">
              <button className={viewMode === 'ltp' ? 'active' : ''} onClick={() => setViewMode('ltp')}>LTP</button>
              <button className={viewMode === 'greeks' ? 'active' : ''} onClick={() => setViewMode('greeks')}>Greeks</button>
            </div>
          </div>

          {loading && <div className="footer"><span>Loading data from GitHub...</span></div>}
          {error && <div className="footer"><span>Error: {error}</span></div>}

          {/* Option Chain Table */}
          <div className="table-wrapper">
            <table className="option-table">
              <thead>
                <tr>
                  <th colSpan="4" className="calls-header">CALLS</th>
                  <th className="strike-header">STRIKE</th>
                  <th colSpan="4" className="puts-header">PUTS</th>
                </tr>
                <tr className="sub-header">
                  {viewMode === 'ltp' ? (
                    <>
                      <th>LTP</th>
                      <th>Chng%</th>
                      <th>OI</th>
                      <th>IV</th>
                    </>
                  ) : (
                    <>
                      <th>Delta</th>
                      <th>Gamma</th>
                      <th>Theta</th>
                      <th>Vega</th>
                    </>
                  )}

                  <th className="strike-col">Strike</th>

                  {viewMode === 'ltp' ? (
                    <>
                      <th>IV</th>
                      <th>OI</th>
                      <th>Chng%</th>
                      <th>LTP</th>
                    </>
                  ) : (
                    <>
                      <th>Vega</th>
                      <th>Theta</th>
                      <th>Gamma</th>
                      <th>Delta</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {optionData.strikes.map((row) => (
                  <tr
                    key={row.strike}
                    className={isAtm(row.strike) ? 'atm-row' : ''}
                    ref={isAtm(row.strike) ? atmRowRef : null}
                  >
                    {/* CALLS */}
                    <td className={`call-cell ${isItm(row.strike, 'call') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="ltp-value">{formatNumber(row.call.ltp)}</span>
                      ) : (
                        <span>{row.call.delta.toFixed(2)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItm(row.strike, 'call') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className={getChangeClass(row.call.change)}>{row.call.change > 0 ? '+' : ''}{row.call.change.toFixed(2)}%</span>
                      ) : (
                        <span>{row.call.gamma.toFixed(3)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItm(row.strike, 'call') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="oi-value">{formatLargeNumber(row.call.oi)}</span>
                      ) : (
                        <span>{row.call.theta.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItm(row.strike, 'call') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="iv-value">{row.call.iv}</span>
                      ) : (
                        <span>{row.call.vega.toFixed(1)}</span>
                      )}
                    </td>

                    {/* STRIKE */}
                    <td className={`strike-cell ${isAtm(row.strike) ? 'atm' : ''}`}>
                      {row.strike}
                    </td>

                    {/* PUTS */}
                    <td className={`put-cell ${isItm(row.strike, 'put') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="iv-value">{row.put.iv}</span>
                      ) : (
                        <span>{row.put.vega.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItm(row.strike, 'put') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="oi-value">{formatLargeNumber(row.put.oi)}</span>
                      ) : (
                        <span>{row.put.theta.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItm(row.strike, 'put') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className={getChangeClass(row.put.change)}>{row.put.change > 0 ? '+' : ''}{row.put.change.toFixed(2)}%</span>
                      ) : (
                        <span>{row.put.gamma.toFixed(3)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItm(row.strike, 'put') ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="ltp-value">{formatNumber(row.put.ltp)}</span>
                      ) : (
                        <span>{row.put.delta.toFixed(2)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="footer">
            <span>Last Updated: {optionData.lastUpdated || '-'}</span>
          </div>

          {showToastFlag && (
            <div className="toast">{toastMessage}</div>
          )}
        </div>
      )
    }

    export default HistoricalOptionChain
