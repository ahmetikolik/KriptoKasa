import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  executeTrade,
  getPortfolio,
  getPriceHistory,
  getPrices,
  login,
  queryAi,
  register,
} from './api/client'
import './App.css'

const emptyAuth = {
  email: '',
  password: '',
}

const formatMoney = (value) =>
  Number(value ?? 0).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

const formatCrypto = (value) =>
  Number(value ?? 0).toLocaleString('en-US', {
    maximumFractionDigits: 10,
  })

const formatPercent = (value) => {
  const number = Number(value ?? 0)
  const sign = number > 0 ? '+' : ''
  return `${sign}${number.toFixed(2)}%`
}

const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

function buildPortfolioSummary(portfolio, prices) {
  if (!portfolio) {
    return {
      allocations: [],
      holdingsValue: 0,
      investedCost: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      totalValue: 0,
    }
  }

  const priceMap = new Map(prices.map((price) => [price.symbol, Number(price.price)]))
  const cryptoAllocations = portfolio.holdings.map((holding, index) => {
    const quantity = Number(holding.quantity)
    const price = priceMap.get(holding.symbol) ?? 0
    return {
      color: chartColors[index % chartColors.length],
      label: holding.symbol,
      quantity,
      value: quantity * price,
    }
  })

  const holdingsValue = cryptoAllocations.reduce((total, item) => total + item.value, 0)
  const totalValue = Number(portfolio.fiatBalance ?? 0) + holdingsValue
  const cashAllocation = {
    color: '#64748b',
    label: 'Cash',
    quantity: null,
    value: Number(portfolio.fiatBalance ?? 0),
  }
  const allocations = [cashAllocation, ...cryptoAllocations]
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percent: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }))

  const lots = new Map()
  const orderedTransactions = [...(portfolio.recentTransactions ?? [])].reverse()
  orderedTransactions.forEach((transaction) => {
    const symbol = transaction.symbol
    const current = lots.get(symbol) ?? { cost: 0, quantity: 0 }
    const quantity = Number(transaction.quantity)
    const totalAmount = Number(transaction.totalAmount)

    if (transaction.type === 'BUY') {
      lots.set(symbol, {
        cost: current.cost + totalAmount,
        quantity: current.quantity + quantity,
      })
      return
    }

    if (current.quantity <= 0) {
      return
    }

    const soldRatio = Math.min(quantity / current.quantity, 1)
    lots.set(symbol, {
      cost: current.cost * (1 - soldRatio),
      quantity: Math.max(current.quantity - quantity, 0),
    })
  })

  const investedCost = portfolio.holdings.reduce((total, holding) => {
    const lot = lots.get(holding.symbol)
    return total + (lot?.cost ?? 0)
  }, 0)
  const profitLoss = holdingsValue - investedCost
  const profitLossPercent = investedCost > 0 ? (profitLoss / investedCost) * 100 : 0

  return {
    allocations,
    holdingsValue,
    investedCost,
    profitLoss,
    profitLossPercent,
    totalValue,
  }
}

function buildPieGradient(allocations) {
  if (allocations.length === 0) {
    return '#e5e7eb'
  }

  let cursor = 0
  const slices = allocations.map((allocation) => {
    const start = cursor
    const end = cursor + allocation.percent
    cursor = end
    return `${allocation.color} ${start}% ${end}%`
  })

  return `conic-gradient(${slices.join(', ')})`
}

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('cryptopal-session')
    return stored ? JSON.parse(stored) : null
  })
  const [prices, setPrices] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [tradeType, setTradeType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [loading, setLoading] = useState({
    ai: false,
    auth: false,
    history: false,
    prices: false,
    portfolio: false,
    trade: false,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = session?.token

  const loadPrices = useCallback(async () => {
    setLoading((current) => ({ ...current, prices: true }))
    try {
      const data = await getPrices()
      setPrices(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, prices: false }))
    }
  }, [])

  const loadPortfolio = useCallback(async () => {
    if (!token) {
      setPortfolio(null)
      return
    }

    setLoading((current) => ({ ...current, portfolio: true }))
    try {
      const data = await getPortfolio(token)
      setPortfolio(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, portfolio: false }))
    }
  }, [token])

  const loadPriceHistory = useCallback(async (symbol) => {
    if (!symbol) {
      setPriceHistory([])
      return
    }

    setLoading((current) => ({ ...current, history: true }))
    try {
      const data = await getPriceHistory(symbol)
      setPriceHistory(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, history: false }))
    }
  }, [])

  useEffect(() => {
    loadPrices()
    const intervalId = window.setInterval(loadPrices, 15000)
    return () => window.clearInterval(intervalId)
  }, [loadPrices])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  useEffect(() => {
    if (!selectedSymbol && prices.length > 0) {
      setSelectedSymbol(prices[0].symbol)
    }
  }, [prices, selectedSymbol])

  const holdingsBySymbol = useMemo(() => {
    const map = new Map()
    portfolio?.holdings?.forEach((holding) => {
      map.set(holding.symbol, Number(holding.quantity))
    })
    return map
  }, [portfolio])

  const selectedChartAsset = useMemo(() => {
    if (prices.length === 0) {
      return null
    }
    return prices.find((asset) => asset.symbol === selectedSymbol) ?? prices[0]
  }, [prices, selectedSymbol])

  useEffect(() => {
    const symbol = selectedChartAsset?.symbol
    if (!symbol) {
      setPriceHistory([])
      return undefined
    }

    loadPriceHistory(symbol)
    const intervalId = window.setInterval(() => loadPriceHistory(symbol), 15000)
    return () => window.clearInterval(intervalId)
  }, [loadPriceHistory, selectedChartAsset?.symbol])

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, auth: true }))

    try {
      const action = authMode === 'login' ? login : register
      const data = await action(authForm)
      setSession(data)
      localStorage.setItem('cryptopal-session', JSON.stringify(data))
      setMessage(authMode === 'login' ? 'Signed in successfully.' : 'Account created successfully.')
      setAuthForm(emptyAuth)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, auth: false }))
    }
  }

  async function handleTradeSubmit(event) {
    event.preventDefault()
    if (!selectedAsset || !token) {
      return
    }

    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, trade: true }))

    try {
      const response = await executeTrade(token, {
        symbol: selectedAsset.symbol,
        type: tradeType,
        quantity: Number(quantity),
      })
      setMessage(
        `${response.type} order executed: ${formatCrypto(response.quantity)} ${response.symbol}`,
      )
      setSelectedAsset(null)
      setQuantity('')
      await loadPortfolio()
      await loadPrices()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, trade: false }))
    }
  }

  async function handleAiSubmit(event) {
    event.preventDefault()
    if (!token) {
      return
    }

    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, ai: true }))

    try {
      const response = await queryAi(token, { question: aiQuestion })
      setAiAnswer(response.answer)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, ai: false }))
    }
  }

  function openTrade(asset, type) {
    if (!session) {
      setError('Login to trade this asset.')
      return
    }
    setSelectedAsset(asset)
    setTradeType(type)
    setQuantity('')
    setError('')
    setMessage('')
  }

  function signOut() {
    setSession(null)
    setPortfolio(null)
    localStorage.removeItem('cryptopal-session')
    setMessage('Signed out.')
  }

  const canSellSelected =
    selectedAsset && Number(holdingsBySymbol.get(selectedAsset.symbol) ?? 0) > 0

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">CryptoPal</span>
          <h1>Trading Console</h1>
        </div>
        <button className="ghost-button" type="button" onClick={loadPrices}>
          {loading.prices ? 'Refreshing' : 'Refresh'}
        </button>
      </header>

      {(error || message) && (
        <div className={error ? 'notice error' : 'notice success'}>{error || message}</div>
      )}

      <section className="workspace">
        <aside className="side-column">
          <section className="panel">
            <div className="panel-header">
              <h2>{session ? 'Session' : 'Account'}</h2>
            </div>

            {session ? (
              <div className="session-box">
                <div>
                  <span className="label">Signed in as</span>
                  <strong>{session.email}</strong>
                </div>
                <button type="button" onClick={signOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <form className="stack-form" onSubmit={handleAuthSubmit}>
                <div className="segmented-control">
                  <button
                    className={authMode === 'login' ? 'active' : ''}
                    type="button"
                    onClick={() => setAuthMode('login')}
                  >
                    Login
                  </button>
                  <button
                    className={authMode === 'register' ? 'active' : ''}
                    type="button"
                    onClick={() => setAuthMode('register')}
                  >
                    Register
                  </button>
                </div>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                    type="email"
                    value={authForm.email}
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    minLength={6}
                    onChange={(event) =>
                      setAuthForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required
                    type="password"
                    value={authForm.password}
                  />
                </label>
                <button disabled={loading.auth} type="submit">
                  {loading.auth ? 'Please wait' : authMode === 'login' ? 'Login' : 'Create account'}
                </button>
              </form>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Portfolio</h2>
              {loading.portfolio && <span className="status">Loading</span>}
            </div>
            {session ? (
              <Portfolio portfolio={portfolio} prices={prices} />
            ) : (
              <div className="empty-state">Login to see balance, holdings, and recent orders.</div>
            )}
          </section>
        </aside>

        <section className="main-column">
          <section className="panel market-panel">
            <div className="panel-header">
              <div>
                <h2>Live Market</h2>
                <p>Prices are read from the backend cache and refreshed automatically.</p>
              </div>
              {loading.prices && <span className="status">Syncing</span>}
            </div>

            <div className="market-grid">
              {prices.map((asset) => {
                const heldQuantity = holdingsBySymbol.get(asset.symbol) ?? 0
                const dailyChange = Number(asset.changePercent ?? 0)
                const trendClass = dailyChange >= 0 ? 'up' : 'down'
                return (
                  <button
                    className={`asset-card ${trendClass} ${
                      selectedChartAsset?.symbol === asset.symbol ? 'selected' : ''
                    }`}
                    key={asset.symbol}
                    onClick={() => setSelectedSymbol(asset.symbol)}
                    type="button"
                  >
                    <div className="asset-card-top">
                      <div>
                        <span className="asset-symbol">{asset.symbol}</span>
                        <span className="asset-pair">{asset.pair}</span>
                      </div>
                      <span className={`daily-change ${trendClass}`}>{formatPercent(dailyChange)}</span>
                    </div>
                    <strong>{formatMoney(asset.price)}</strong>
                    <div className="asset-card-meta">
                      <span>24h</span>
                      <span>Held: {formatCrypto(heldQuantity)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>{selectedChartAsset ? `${selectedChartAsset.symbol} Chart` : 'Price Chart'}</h2>
                {selectedChartAsset && (
                  <p>
                    {formatMoney(selectedChartAsset.price)} -{' '}
                    {formatPercent(selectedChartAsset.changePercent)} 24h
                  </p>
                )}
              </div>
              {loading.history && <span className="status">Loading</span>}
            </div>
            <PriceChart history={priceHistory} />
            <div className="chart-actions">
              <button
                disabled={!selectedChartAsset || !session}
                onClick={() => openTrade(selectedChartAsset, 'BUY')}
                type="button"
              >
                Buy
              </button>
              <button
                className="ghost-button"
                disabled={
                  !selectedChartAsset ||
                  !session ||
                  Number(holdingsBySymbol.get(selectedChartAsset.symbol) ?? 0) <= 0
                }
                onClick={() => openTrade(selectedChartAsset, 'SELL')}
                type="button"
              >
                Sell
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Recent Orders</h2>
            </div>
            <RecentOrders transactions={portfolio?.recentTransactions ?? []} />
          </section>

          <section className="panel ai-panel">
            <div className="panel-header">
              <h2>AI Insights</h2>
              {loading.ai && <span className="status">Thinking</span>}
            </div>
            {session ? (
              <form className="ai-form" onSubmit={handleAiSubmit}>
                <textarea
                  maxLength={1000}
                  onChange={(event) => setAiQuestion(event.target.value)}
                  placeholder="Portföyümde risk var mı?"
                  required
                  rows={3}
                  value={aiQuestion}
                />
                <button disabled={loading.ai || !aiQuestion.trim()} type="submit">
                  {loading.ai ? 'Asking' : 'Ask AI'}
                </button>
                {aiAnswer && <div className="ai-answer">{aiAnswer}</div>}
              </form>
            ) : (
              <div className="empty-state">Login to ask AI about your portfolio.</div>
            )}
          </section>
        </section>
      </section>

      {selectedAsset && (
        <div className="modal-backdrop">
          <form className="trade-modal" onSubmit={handleTradeSubmit}>
            <div className="panel-header">
              <div>
                <h2>
                  {tradeType} {selectedAsset.symbol}
                </h2>
                <p>Market price: {formatMoney(selectedAsset.price)}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedAsset(null)}>
                X
              </button>
            </div>
            <div className="segmented-control">
              <button
                className={tradeType === 'BUY' ? 'active' : ''}
                type="button"
                onClick={() => setTradeType('BUY')}
              >
                Buy
              </button>
              <button
                className={tradeType === 'SELL' ? 'active' : ''}
                disabled={!canSellSelected}
                type="button"
                onClick={() => setTradeType('SELL')}
              >
                Sell
              </button>
            </div>
            <label>
              Quantity
              <input
                autoFocus
                min="0.0000000001"
                onChange={(event) => setQuantity(event.target.value)}
                required
                step="0.0000000001"
                type="number"
                value={quantity}
              />
            </label>
            <div className="estimate">
              Estimated total
              <strong>{formatMoney(Number(quantity || 0) * Number(selectedAsset.price))}</strong>
            </div>
            <button disabled={loading.trade} type="submit">
              {loading.trade ? 'Executing' : 'Execute order'}
            </button>
          </form>
        </div>
      )}
    </main>
  )
}

function PriceChart({ history }) {
  const chartData = history.map((point) => ({
    ...point,
    price: Number(point.price),
    time: new Date(point.capturedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))

  if (chartData.length === 0) {
    return <div className="empty-state">Price history will appear after market snapshots are collected.</div>
  }

  return (
    <div className="price-chart">
      <ResponsiveContainer height={260} width="100%">
        <LineChart data={chartData} margin={{ bottom: 4, left: 4, right: 18, top: 8 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" />
          <XAxis dataKey="time" minTickGap={24} stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis
            domain={['auto', 'auto']}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              Number(value).toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })
            }
            width={72}
          />
          <Tooltip
            formatter={(value) => [formatMoney(value), 'Price']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Line
            dataKey="price"
            dot={false}
            isAnimationActive={false}
            stroke="#2563eb"
            strokeWidth={3}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function Portfolio({ portfolio, prices }) {
  if (!portfolio) {
    return <div className="empty-state">Portfolio data is loading.</div>
  }

  const summary = buildPortfolioSummary(portfolio, prices)
  const pieGradient = buildPieGradient(summary.allocations)
  const profitClass = summary.profitLoss >= 0 ? 'positive' : 'negative'

  return (
    <div className="portfolio-block">
      <div className="balance-box">
        <span className="label">Cash balance</span>
        <strong>{formatMoney(portfolio.fiatBalance)}</strong>
      </div>
      <div className="portfolio-chart-block">
        <div className="donut-chart" style={{ background: pieGradient }}>
          <div className="donut-hole">
            <span>Total</span>
            <strong>{formatMoney(summary.totalValue)}</strong>
          </div>
        </div>
        <div className="allocation-list">
          {summary.allocations.length === 0 ? (
            <div className="empty-state">No portfolio value yet.</div>
          ) : (
            summary.allocations.map((allocation) => (
              <div className="allocation-row" key={allocation.label}>
                <span className="swatch" style={{ backgroundColor: allocation.color }}></span>
                <span>{allocation.label}</span>
                <strong>{allocation.percent.toFixed(1)}%</strong>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="holdings-list">
        {portfolio.holdings.length === 0 ? (
          <div className="empty-state">No crypto holdings yet.</div>
        ) : (
          portfolio.holdings.map((holding) => (
            <div className="holding-row" key={holding.symbol}>
              <span>{holding.symbol}</span>
              <strong>{formatCrypto(holding.quantity)}</strong>
            </div>
          ))
        )}
      </div>
      <div className="profit-card">
        <div>
          <span className="label">Crypto value</span>
          <strong>{formatMoney(summary.holdingsValue)}</strong>
        </div>
        <div>
          <span className="label">Cost basis</span>
          <strong>{formatMoney(summary.investedCost)}</strong>
        </div>
        <div className={profitClass}>
          <span className="label">Profit / Loss</span>
          <strong>{formatMoney(summary.profitLoss)}</strong>
          <small>{summary.profitLossPercent.toFixed(2)}%</small>
        </div>
      </div>
    </div>
  )
}

function RecentOrders({ transactions }) {
  if (transactions.length === 0) {
    return <div className="empty-state">No orders yet.</div>
  }

  return (
    <div className="orders-table">
      <div className="orders-head">
        <span>Type</span>
        <span>Asset</span>
        <span>Qty</span>
        <span>Total</span>
      </div>
      {transactions.map((transaction) => (
        <div className="orders-row" key={transaction.id}>
          <span className={transaction.type === 'BUY' ? 'buy-text' : 'sell-text'}>
            {transaction.type}
          </span>
          <span>{transaction.symbol}</span>
          <span>{formatCrypto(transaction.quantity)}</span>
          <span>{formatMoney(transaction.totalAmount)}</span>
        </div>
      ))}
    </div>
  )
}

export default App
