import { useState, useEffect, useRef, useMemo } from 'react'
import {
  DEFAULT_DATE,
  DEFAULT_SYMBOL,
  fetchAvailableDates,
  fetchAvailableSymbols,
  fetchOptionCsvRows,
  isRateLimitError,
} from '../api/data.js'
import {
  buildOptionData,
  formatLargeNumber,
  formatNumber,
  getChangeClass,
  getPreviousWeekdayRelativeToToday,
  getUrlParam,
  getWeekdayDates,
  isAtmStrike,
  isItmStrike,
} from './historicalOptionChainUtils.js'
import './HistoricalOptionChain.css'

function HistoricalOptionChain() {
  const [availableDates, setAvailableDates] = useState([])
  const [availableSymbols, setAvailableSymbols] = useState([])
  const [symbolSearchQuery, setSymbolSearchQuery] = useState('')
  const [showSymbolSearch, setShowSymbolSearch] = useState(false)
  const [highlightedSymbolIndex, setHighlightedSymbolIndex] = useState(0)
  const [selectedSymbol, setSelectedSymbol] = useState(() => getUrlParam('symbol') || DEFAULT_SYMBOL)
  const [selectedExpiry, setSelectedExpiry] = useState(() => getUrlParam('expiry') || '')
  const [selectedDate, setSelectedDate] = useState(() => getUrlParam('date') || '')
  const [viewMode, setViewMode] = useState('ltp')
  const [showPerLot, setShowPerLot] = useState(() => getUrlParam('perLot') === '1')
  const [csvRows, setCsvRows] = useState([])
  const [atmStrike, setAtmStrike] = useState(0)
  const [toastMessage, setToastMessage] = useState('')
  const [showToastFlag, setShowToastFlag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const atmRowRef = useRef(null)
  const symbolSelectorRef = useRef(null)
  const symbolSearchInputRef = useRef(null)
  const highlightedSymbolRef = useRef(null)

  const weekdayDates = useMemo(() => getWeekdayDates(availableDates), [availableDates])
  const filteredSymbols = useMemo(() => {
    const query = symbolSearchQuery.trim().toLowerCase()
    if (!query) return availableSymbols

    return availableSymbols.filter((symbol) => symbol.toLowerCase().includes(query))
  }, [availableSymbols, symbolSearchQuery])

  const optionData = useMemo(
    () => buildOptionData(csvRows, selectedSymbol, selectedDate, selectedExpiry),
    [csvRows, selectedSymbol, selectedDate, selectedExpiry],
  )
  const premiumMultiplier = showPerLot && optionData.lotSize > 0 ? optionData.lotSize : 1

  useEffect(() => {
    let ignore = false

    async function loadDates() {
      setLoading(true)
      setError('')
      try {
        const dates = await fetchAvailableDates()

        if (!ignore) {
          setAvailableDates(dates)
          setSelectedDate((prev) => {
            if (prev && dates.includes(prev)) return prev
            return getPreviousWeekdayRelativeToToday(dates)
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
        const symbols = await fetchAvailableSymbols(selectedDate)

        if (!ignore) {
          setAvailableSymbols(symbols)
          setShowSymbolSearch(false)
          setSymbolSearchQuery('')
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
            setShowSymbolSearch(false)
            setSymbolSearchQuery('')
            setSelectedSymbol((prev) => prev || DEFAULT_SYMBOL)
            showToast('GitHub API rate limit hit. Using fallback symbol list.')
          } else {
            setAvailableSymbols([])
            setShowSymbolSearch(false)
            setSymbolSearchQuery('')
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
        const { rows, usedRawFallback } = await fetchOptionCsvRows(selectedDate, selectedSymbol)

        if (!ignore) {
          if (usedRawFallback) {
            showToast('GitHub API rate limit hit. Using raw CSV endpoint.')
          }
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

  useEffect(() => {
    if (!showSymbolSearch) return undefined

    function handlePointerDown(event) {
      if (!symbolSelectorRef.current?.contains(event.target)) {
        setShowSymbolSearch(false)
        setSymbolSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showSymbolSearch])

  useEffect(() => {
    if (showSymbolSearch) {
      symbolSearchInputRef.current?.focus()
      symbolSearchInputRef.current?.select()
    }
  }, [showSymbolSearch])

  useEffect(() => {
    if (!showSymbolSearch) return

    const selectedIndex = filteredSymbols.indexOf(selectedSymbol)
    setHighlightedSymbolIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [showSymbolSearch, filteredSymbols, selectedSymbol])

  useEffect(() => {
    if (showSymbolSearch) {
      highlightedSymbolRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedSymbolIndex, showSymbolSearch])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedDate) params.set('date', selectedDate)
    if (selectedSymbol) params.set('symbol', selectedSymbol)
    if (selectedExpiry) params.set('expiry', selectedExpiry)
    if (showPerLot) params.set('perLot', '1')
    const newSearch = params.toString()
    const currentSearch = window.location.search.replace(/^\?/, '')
    if (newSearch !== currentSearch) {
      window.history.replaceState(null, '', newSearch ? `?${newSearch}` : window.location.pathname)
    }
  }, [selectedDate, selectedSymbol, selectedExpiry, showPerLot])

  function showToast(message) {
    setToastMessage(message)
    setShowToastFlag(true)
    setTimeout(() => {
      setShowToastFlag(false)
    }, 3000)
  }

  function closeSymbolSearch() {
    setShowSymbolSearch(false)
    setSymbolSearchQuery('')
    setHighlightedSymbolIndex(0)
  }

  function openSymbolSearch() {
    setShowSymbolSearch(true)
  }

  function handleSymbolSelect(symbol) {
    setSelectedSymbol(symbol)
    closeSymbolSearch()
  }

  function handleSymbolSearchKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSymbolSearch()
      return
    }

    if (!filteredSymbols.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedSymbolIndex((prev) => Math.min(prev + 1, filteredSymbols.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedSymbolIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      handleSymbolSelect(filteredSymbols[highlightedSymbolIndex])
    }
  }

  function formatPremium(value) {
    return formatNumber(value * premiumMultiplier)
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
                <div className="symbol-search-group" ref={symbolSelectorRef}>
                  <button
                    type="button"
                    className={`symbol-trigger ${showSymbolSearch ? 'active' : ''}`}
                    onClick={() => {
                      if (showSymbolSearch) {
                        closeSymbolSearch()
                      } else {
                        openSymbolSearch()
                      }
                    }}
                    aria-haspopup="listbox"
                    aria-expanded={showSymbolSearch}
                  >
                    <span>{selectedSymbol || 'Select symbol'}</span>
                    <span className="symbol-trigger-icon">▾</span>
                  </button>

                  {showSymbolSearch && (
                    <div className="symbol-search-popover">
                      <input
                        ref={symbolSearchInputRef}
                        type="search"
                        className="symbol-search-input"
                        value={symbolSearchQuery}
                        onChange={(e) => setSymbolSearchQuery(e.target.value)}
                        onKeyDown={handleSymbolSearchKeyDown}
                        placeholder="Search symbol"
                        aria-label="Search symbols"
                      />
                      <div className="symbol-options" role="listbox" aria-label="Available symbols">
                        {!filteredSymbols.length && (
                          <div className="symbol-empty-state">No matching symbols</div>
                        )}
                        {filteredSymbols.map((symbol, index) => {
                          const isSelected = selectedSymbol === symbol
                          const isHighlighted = highlightedSymbolIndex === index

                          return (
                            <button
                              key={symbol}
                              ref={isHighlighted ? highlightedSymbolRef : null}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={`symbol-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`.trim()}
                              onMouseEnter={() => setHighlightedSymbolIndex(index)}
                              onClick={() => handleSymbolSelect(symbol)}
                            >
                              <span>{symbol}</span>
                              {isSelected && <span className="symbol-option-check">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
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

            <div className="control-strip">
              <div className="view-toggle">
                <button className={viewMode === 'ltp' ? 'active' : ''} onClick={() => setViewMode('ltp')}>LTP</button>
                <button className={viewMode === 'greeks' ? 'active' : ''} onClick={() => setViewMode('greeks')}>Greeks</button>
              </div>

              <button
                type="button"
                className={`per-lot-toggle ${showPerLot ? 'active' : ''}`}
                onClick={() => setShowPerLot((prev) => !prev)}
                title={optionData.lotSize > 0 ? `Multiply premium values by lot size (${optionData.lotSize})` : 'Multiply premium values by lot size'}
                aria-pressed={showPerLot}
              >
                Per lot{optionData.lotSize > 0 ? ` × ${optionData.lotSize}` : ''}
              </button>
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
                      <th>{showPerLot ? 'LTP / Lot' : 'LTP'}</th>
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
                      <th>{showPerLot ? 'LTP / Lot' : 'LTP'}</th>
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
                    className={isAtmStrike(row.strike, atmStrike) ? 'atm-row' : ''}
                    ref={isAtmStrike(row.strike, atmStrike) ? atmRowRef : null}
                  >
                    {/* CALLS */}
                    <td className={`call-cell ${isItmStrike(row.strike, 'call', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="ltp-value">{formatPremium(row.call.ltp)}</span>
                      ) : (
                        <span>{row.call.delta.toFixed(2)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItmStrike(row.strike, 'call', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className={getChangeClass(row.call.change)}>{row.call.change > 0 ? '+' : ''}{row.call.change.toFixed(2)}%</span>
                      ) : (
                        <span>{row.call.gamma.toFixed(3)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItmStrike(row.strike, 'call', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="oi-value">{formatLargeNumber(row.call.oi)}</span>
                      ) : (
                        <span>{row.call.theta.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`call-cell ${isItmStrike(row.strike, 'call', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="iv-value">{row.call.iv}</span>
                      ) : (
                        <span>{row.call.vega.toFixed(1)}</span>
                      )}
                    </td>

                    {/* STRIKE */}
                    <td className={`strike-cell ${isAtmStrike(row.strike, atmStrike) ? 'atm' : ''}`}>
                      {row.strike}
                    </td>

                    {/* PUTS */}
                    <td className={`put-cell ${isItmStrike(row.strike, 'put', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="iv-value">{row.put.iv}</span>
                      ) : (
                        <span>{row.put.vega.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItmStrike(row.strike, 'put', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="oi-value">{formatLargeNumber(row.put.oi)}</span>
                      ) : (
                        <span>{row.put.theta.toFixed(1)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItmStrike(row.strike, 'put', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className={getChangeClass(row.put.change)}>{row.put.change > 0 ? '+' : ''}{row.put.change.toFixed(2)}%</span>
                      ) : (
                        <span>{row.put.gamma.toFixed(3)}</span>
                      )}
                    </td>

                    <td className={`put-cell ${isItmStrike(row.strike, 'put', optionData.currentPrice) ? 'itm' : ''}`}>
                      {viewMode === 'ltp' ? (
                        <span className="ltp-value">{formatPremium(row.put.ltp)}</span>
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
            <span>
              Last Updated: {optionData.lastUpdated || '-'}
              {showPerLot && optionData.lotSize > 0 ? ` • Premiums shown per lot (${optionData.lotSize})` : ''}
            </span>
          </div>

          {showToastFlag && (
            <div className="toast">{toastMessage}</div>
          )}
        </div>
      )
}

export default HistoricalOptionChain
