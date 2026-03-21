import { useState, useEffect, useRef } from 'react'
import { mockOptionChainData, symbols, expiryDates } from './mockData.js'
import './HistoricalOptionChain.css'

function HistoricalOptionChain() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY')
  const [selectedExpiry, setSelectedExpiry] = useState('2026-01-06')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('ltp')
  const [optionData] = useState(mockOptionChainData)
  const [atmStrike, setAtmStrike] = useState(26300)
  const [toastMessage, setToastMessage] = useState('')
  const [showToastFlag, setShowToastFlag] = useState(false)
  const atmRowRef = useRef(null)

  useEffect(() => {
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
    const date = new Date(selectedDate)
    do {
      date.setDate(date.getDate() - 1)
    } while (date.getDay() === 0 || date.getDay() === 6)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  function goToNextDate() {
    const date = new Date(selectedDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    do {
      date.setDate(date.getDate() + 1)
    } while (date.getDay() === 0 || date.getDay() === 6)

    if (date > today) {
      showToast("You can't travel to the future! 🚀")
      return
    }

    setSelectedDate(date.toISOString().split('T')[0])
  }

  return (
    <div className="option-chain-container">
      {/* Header Controls */}
      <div className="header">
        <div className="symbol-info">
          <div className="symbol-selector">
            <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
              {symbols.map((symbol) => (
                <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
              ))}
            </select>
            <div className="current-price">
              <span className="price">{formatNumber(optionData.currentPrice)}</span>
              <span className={`change ${getChangeClass(optionData.changePercent)}`}>
                {optionData.changePercent > 0 ? '+' : ''}{optionData.changePercent}%
              </span>
            </div>
          </div>

          <div className="expiry-selector">
            <label>Expiry:</label>
            <select value={selectedExpiry} onChange={(e) => setSelectedExpiry(e.target.value)}>
              {expiryDates.map((expiry) => (
                <option key={expiry} value={expiry}>
                  {new Date(expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
                    <span className={getChangeClass(row.call.change)}>{row.call.change > 0 ? '+' : ''}{row.call.change}%</span>
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
                    <span className={getChangeClass(row.put.change)}>{row.put.change > 0 ? '+' : ''}{row.put.change}%</span>
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
        <span>Last Updated: {optionData.lastUpdated}</span>
      </div>

      {showToastFlag && (
        <div className="toast">{toastMessage}</div>
      )}
    </div>
  )
}

export default HistoricalOptionChain

