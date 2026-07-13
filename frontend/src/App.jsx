import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  executeTrade,
  getPortfolio,
  getPrices,
  login,
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

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('cryptopal-session')
    return stored ? JSON.parse(stored) : null
  })
  const [prices, setPrices] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [tradeType, setTradeType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState({
    auth: false,
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

  useEffect(() => {
    loadPrices()
    const intervalId = window.setInterval(loadPrices, 15000)
    return () => window.clearInterval(intervalId)
  }, [loadPrices])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  const holdingsBySymbol = useMemo(() => {
    const map = new Map()
    portfolio?.holdings?.forEach((holding) => {
      map.set(holding.symbol, Number(holding.quantity))
    })
    return map
  }, [portfolio])

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

  function openTrade(asset, type) {
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
              <Portfolio portfolio={portfolio} />
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
                return (
                  <article className="asset-row" key={asset.symbol}>
                    <div>
                      <span className="asset-symbol">{asset.symbol}</span>
                      <span className="asset-pair">{asset.pair}</span>
                    </div>
                    <strong>{formatMoney(asset.price)}</strong>
                    <span className="held">Held: {formatCrypto(heldQuantity)}</span>
                    <div className="row-actions">
                      <button disabled={!session} type="button" onClick={() => openTrade(asset, 'BUY')}>
                        Buy
                      </button>
                      <button
                        disabled={!session || heldQuantity <= 0}
                        type="button"
                        onClick={() => openTrade(asset, 'SELL')}
                      >
                        Sell
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Recent Orders</h2>
            </div>
            <RecentOrders transactions={portfolio?.recentTransactions ?? []} />
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

function Portfolio({ portfolio }) {
  if (!portfolio) {
    return <div className="empty-state">Portfolio data is loading.</div>
  }

  return (
    <div className="portfolio-block">
      <div className="balance-box">
        <span className="label">Cash balance</span>
        <strong>{formatMoney(portfolio.fiatBalance)}</strong>
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
