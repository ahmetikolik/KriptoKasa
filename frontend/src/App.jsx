import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  History,
  LogIn,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react'
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

const PAGE_SIZE = 8
const emptyAuth = { email: '', password: '' }
const chartColors = ['#7dfab2', '#60a5fa', '#f5c96a', '#c084fc', '#fb7185', '#22d3ee']
const assistantSuggestions = [
  'Portföyümdeki en büyük risk nedir?',
  'Nakit oranımı değerlendir',
  'Son işlemlerimi kısaca özetle',
]

const coinDirectory = {
  BTC: { color: '#f7931a', name: 'Bitcoin' },
  ETH: { color: '#627eea', name: 'Ethereum' },
  USDT: { color: '#26a17b', name: 'Tether' },
  BNB: { color: '#f3ba2f', name: 'BNB' },
  SOL: { color: '#8b5cf6', name: 'Solana' },
  XRP: { color: '#4f708d', name: 'XRP' },
  USDC: { color: '#2775ca', name: 'USD Coin' },
  ADA: { color: '#3468d4', name: 'Cardano' },
  DOGE: { color: '#c2a633', name: 'Dogecoin' },
  AVAX: { color: '#e84142', name: 'Avalanche' },
  TRX: { color: '#ef4444', name: 'TRON' },
  DOT: { color: '#e6007a', name: 'Polkadot' },
  LINK: { color: '#2a5ada', name: 'Chainlink' },
  MATIC: { color: '#8247e5', name: 'Polygon' },
  LTC: { color: '#7c8ca5', name: 'Litecoin' },
  BCH: { color: '#8dc351', name: 'Bitcoin Cash' },
  UNI: { color: '#ff4d9d', name: 'Uniswap' },
  ATOM: { color: '#5963a8', name: 'Cosmos' },
  XLM: { color: '#64748b', name: 'Stellar' },
  NEAR: { color: '#4ade80', name: 'NEAR Protocol' },
}

function readStoredSession() {
  try {
    const stored = localStorage.getItem('cryptopal-session')
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem('cryptopal-session')
    return null
  }
}

function assetMeta(symbol = '') {
  const cleanSymbol = symbol.toUpperCase().replace(/USDT$/, '')
  return {
    code: cleanSymbol.slice(0, 2),
    symbol: cleanSymbol,
    ...(coinDirectory[cleanSymbol] ?? {
      color: '#5e8a73',
      name: cleanSymbol,
    }),
  }
}

function formatMoney(value) {
  const number = Number(value ?? 0)
  const maximumFractionDigits = Math.abs(number) > 0 && Math.abs(number) < 1 ? 6 : 2
  return `$${number.toLocaleString('tr-TR', {
    maximumFractionDigits,
    minimumFractionDigits: Math.abs(number) >= 1 ? 2 : 0,
  })}`
}

function formatCrypto(value) {
  return Number(value ?? 0).toLocaleString('tr-TR', {
    maximumFractionDigits: 10,
  })
}

function formatPercent(value) {
  const number = Number(value ?? 0)
  return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`
}

function formatDate(value, includeDate = false) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('tr-TR', includeDate
    ? { day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short' }
    : { hour: '2-digit', minute: '2-digit' })
}

function buildPortfolioSummary(portfolio, prices) {
  if (!portfolio) {
    return {
      allocations: [],
      cashPercent: 0,
      holdingsValue: 0,
      investedCost: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      totalValue: 0,
    }
  }

  const priceMap = new Map(prices.map((price) => [assetMeta(price.symbol).symbol, Number(price.price)]))
  const cryptoAllocations = (portfolio.holdings ?? []).map((holding, index) => {
    const symbol = assetMeta(holding.symbol).symbol
    const quantity = Number(holding.quantity)
    const price = priceMap.get(symbol) ?? 0
    return {
      color: chartColors[index % chartColors.length],
      label: symbol,
      quantity,
      value: quantity * price,
    }
  })

  const holdingsValue = cryptoAllocations.reduce((total, item) => total + item.value, 0)
  const cashValue = Number(portfolio.fiatBalance ?? 0)
  const totalValue = cashValue + holdingsValue
  const allocations = [
    { color: '#355647', label: 'Nakit', quantity: null, value: cashValue },
    ...cryptoAllocations,
  ]
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percent: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
    }))

  const lots = new Map()
  const orderedTransactions = [...(portfolio.recentTransactions ?? [])].reverse()
  orderedTransactions.forEach((transaction) => {
    const symbol = assetMeta(transaction.symbol).symbol
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

    if (current.quantity <= 0) return
    const soldRatio = Math.min(quantity / current.quantity, 1)
    lots.set(symbol, {
      cost: current.cost * (1 - soldRatio),
      quantity: Math.max(current.quantity - quantity, 0),
    })
  })

  const investedCost = (portfolio.holdings ?? []).reduce((total, holding) => {
    return total + (lots.get(assetMeta(holding.symbol).symbol)?.cost ?? 0)
  }, 0)
  const profitLoss = holdingsValue - investedCost
  const profitLossPercent = investedCost > 0 ? (profitLoss / investedCost) * 100 : 0

  return {
    allocations,
    cashPercent: totalValue > 0 ? (cashValue / totalValue) * 100 : 0,
    holdingsValue,
    investedCost,
    profitLoss,
    profitLossPercent,
    totalValue,
  }
}

function buildPieGradient(allocations) {
  if (allocations.length === 0) return '#173025'
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
  const [session, setSession] = useState(readStoredSession)
  const [prices, setPrices] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [tradeType, setTradeType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [lastSync, setLastSync] = useState(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [messages, setMessages] = useState([])
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
      setPrices(Array.isArray(data) ? data : [])
      setLastSync(new Date())
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
      setPortfolio(await getPortfolio(token))
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
      setPriceHistory(Array.isArray(data) ? data : [])
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
      setSelectedSymbol(assetMeta(prices[0].symbol).symbol)
    }
  }, [prices, selectedSymbol])

  const selectedChartAsset = useMemo(() => {
    if (prices.length === 0) return null
    return prices.find((asset) => assetMeta(asset.symbol).symbol === selectedSymbol) ?? prices[0]
  }, [prices, selectedSymbol])

  useEffect(() => {
    const symbol = selectedChartAsset?.symbol
    if (!symbol || !session) {
      setPriceHistory([])
      return undefined
    }
    loadPriceHistory(symbol)
    const intervalId = window.setInterval(() => loadPriceHistory(symbol), 15000)
    return () => window.clearInterval(intervalId)
  }, [loadPriceHistory, selectedChartAsset?.symbol, session])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (!selectedAsset && !assistantOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedAsset(null)
        setAssistantOpen(false)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [assistantOpen, selectedAsset])

  const holdingsBySymbol = useMemo(() => {
    const map = new Map()
    portfolio?.holdings?.forEach((holding) => {
      map.set(assetMeta(holding.symbol).symbol, Number(holding.quantity))
    })
    return map
  }, [portfolio])

  const summary = useMemo(() => buildPortfolioSummary(portfolio, prices), [portfolio, prices])

  const filteredPrices = useMemo(() => {
    const query = search.trim().toLocaleUpperCase('tr-TR')
    if (!query) return prices
    return prices.filter((asset) => {
      const meta = assetMeta(asset.symbol)
      return `${meta.symbol} ${meta.name}`.toLocaleUpperCase('tr-TR').includes(query)
    })
  }, [prices, search])

  const totalPages = Math.max(1, Math.ceil(filteredPrices.length / PAGE_SIZE))
  const activePage = Math.min(page, totalPages)
  const pagedPrices = filteredPrices.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const averageChange = prices.length
    ? prices.reduce((total, asset) => total + Number(asset.changePercent ?? 0), 0) / prices.length
    : 0

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
      setMessage(authMode === 'login' ? 'Tekrar hoş geldiniz.' : 'Hesabınız kullanıma hazır.')
      setAuthForm(emptyAuth)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, auth: false }))
    }
  }

  async function handleTradeSubmit(event) {
    event.preventDefault()
    if (!selectedAsset || !token) return
    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, trade: true }))
    try {
      const response = await executeTrade(token, {
        quantity: Number(quantity),
        symbol: assetMeta(selectedAsset.symbol).symbol,
        type: tradeType,
      })
      setMessage(
        `${assetMeta(response.symbol).symbol} ${response.type === 'BUY' ? 'alımı' : 'satışı'} ${formatMoney(response.executionPrice)} fiyatından tamamlandı.`,
      )
      setSelectedAsset(null)
      setQuantity('')
      await Promise.all([loadPortfolio(), loadPrices()])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, trade: false }))
    }
  }

  async function askAssistant(question = aiQuestion) {
    const cleanQuestion = question.trim()
    if (!token || !cleanQuestion || loading.ai) return
    setError('')
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: 'user', text: cleanQuestion },
    ])
    setAiQuestion('')
    setLoading((current) => ({ ...current, ai: true }))
    try {
      const response = await queryAi(token, { question: cleanQuestion })
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: response.answer },
      ])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, ai: false }))
    }
  }

  function handleAiSubmit(event) {
    event.preventDefault()
    askAssistant()
  }

  function openTrade(asset, type = 'BUY') {
    if (!session) {
      setError('İşlem yapmak için giriş yapmanız gerekiyor.')
      return
    }
    setSelectedAsset(asset)
    setSelectedSymbol(assetMeta(asset.symbol).symbol)
    setTradeType(type)
    setQuantity('')
    setError('')
  }

  function setQuantityFromPercent(percent) {
    if (!selectedAsset) return
    const price = Number(selectedAsset.price)
    const symbol = assetMeta(selectedAsset.symbol).symbol
    const available = tradeType === 'BUY'
      ? Number(portfolio?.fiatBalance ?? 0) / price
      : Number(holdingsBySymbol.get(symbol) ?? 0)
    const nextQuantity = Math.max(0, available * percent)
    setQuantity(nextQuantity ? nextQuantity.toFixed(10).replace(/0+$/, '').replace(/\.$/, '') : '')
  }

  function signOut() {
    setSession(null)
    setPortfolio(null)
    setMessages([])
    setAssistantOpen(false)
    localStorage.removeItem('cryptopal-session')
  }

  const dismissNotice = () => {
    setError('')
    setMessage('')
  }

  if (!session) {
    return (
      <AuthScreen
        authForm={authForm}
        authMode={authMode}
        error={error}
        loading={loading}
        message={message}
        onDismiss={dismissNotice}
        onFormChange={setAuthForm}
        onModeChange={setAuthMode}
        onRefresh={loadPrices}
        onSubmit={handleAuthSubmit}
        prices={prices}
      />
    )
  }

  const selectedMeta = assetMeta(selectedChartAsset?.symbol)
  const selectedHolding = Number(holdingsBySymbol.get(selectedMeta.symbol) ?? 0)
  const selectedChange = Number(selectedChartAsset?.changePercent ?? 0)
  const tradePrice = Number(selectedAsset?.price ?? 0)
  const tradeSymbol = assetMeta(selectedAsset?.symbol).symbol
  const heldQuantity = Number(holdingsBySymbol.get(tradeSymbol) ?? 0)
  const estimate = Number(quantity || 0) * tradePrice
  const invalidTrade = Number(quantity) <= 0
    || (tradeType === 'BUY' && estimate > Number(portfolio?.fiatBalance ?? 0))
    || (tradeType === 'SELL' && Number(quantity) > heldQuantity)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CryptoPal ana sayfa">
          <span className="brand-mark">C</span>
          <span><strong>CryptoPal</strong><small>market intelligence</small></span>
        </a>
        <nav aria-label="Ana menü">
          <a className="active" href="#markets"><BarChart3 size={15} /> Piyasalar</a>
          <a href="#portfolio"><WalletCards size={15} /> Portföy</a>
        </nav>
        <div className="topbar-actions">
          <span className="live-badge"><i /> CANLI</span>
          <button className="assistant-trigger" type="button" onClick={() => setAssistantOpen(true)}>
            <MessageSquareText size={16} />
            <span>Piyasa Asistanı</span>
          </button>
          <div className="user-chip" title={session.email}>
            <span>{session.email?.[0]?.toUpperCase() ?? 'U'}</span>
            <small>{session.email}</small>
          </div>
          <button className="icon-button" type="button" onClick={signOut} aria-label="Çıkış yap" title="Çıkış yap">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {(error || message) && (
        <div className={`notice-toast ${error ? 'error' : 'success'}`} role="status">
          {error ? <Activity size={16} /> : <CheckCircle2 size={16} />}
          <span>{error || message}</span>
          <button type="button" onClick={dismissNotice} aria-label="Bildirimi kapat"><X size={15} /></button>
        </div>
      )}

      <main className="dashboard" id="top">
        <section className="market-pulse">
          <span className="pulse-ring"><Activity size={19} /></span>
          <div><strong>Piyasa akışı aktif</strong><small>Fiyatlar sunucudan 15 saniyede bir yenilenir</small></div>
          <span className="sync-time"><Clock3 size={13} /> Son eşitleme {lastSync ? formatDate(lastSync) : 'bekleniyor'}</span>
        </section>

        <section className="overview-grid">
          <article className="portfolio-hero">
            <div className="hero-topline">
              <span className="section-kicker">TOPLAM PORTFÖY</span>
              <span className="privacy-note"><ShieldCheck size={13} /> Güvenli oturum</span>
            </div>
            <strong className="hero-value">{loading.portfolio && !portfolio ? '—' : formatMoney(summary.totalValue)}</strong>
            <div className={`hero-change ${summary.profitLoss >= 0 ? 'positive' : 'negative'}`}>
              {summary.profitLoss >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              <span>{formatMoney(summary.profitLoss)} <small>tahmini kâr/zarar</small></span>
            </div>
            <div className="allocation-track" aria-label={`Nakit oranı yüzde ${summary.cashPercent.toFixed(1)}`}>
              <span style={{ width: `${summary.cashPercent}%` }} />
            </div>
            <div className="hero-stats">
              <div><small>Nakit</small><strong>{formatMoney(portfolio?.fiatBalance)}</strong></div>
              <div><small>Kripto varlıklar</small><strong>{formatMoney(summary.holdingsValue)}</strong></div>
              <div><small>Varlık türü</small><strong>{portfolio?.holdings?.filter((item) => Number(item.quantity) > 0).length ?? 0}</strong></div>
            </div>
          </article>

          <article className="chart-card">
            <div className="panel-head compact">
              <div className="selected-asset">
                <span className="asset-icon" style={{ background: selectedMeta.color }}>{selectedMeta.code}</span>
                <span><small>{selectedMeta.name}</small><strong>{selectedMeta.symbol} / USDT</strong></span>
              </div>
              <div className="chart-quote">
                <strong>{selectedChartAsset ? formatMoney(selectedChartAsset.price) : '—'}</strong>
                <span className={selectedChange >= 0 ? 'positive' : 'negative'}>{formatPercent(selectedChange)}</span>
              </div>
            </div>
            <PriceChart history={priceHistory} loading={loading.history} />
            <div className="chart-actions">
              <button type="button" onClick={() => openTrade(selectedChartAsset, 'BUY')} disabled={!selectedChartAsset}>Al</button>
              <button className="secondary-action" type="button" onClick={() => openTrade(selectedChartAsset, 'SELL')} disabled={!selectedChartAsset || selectedHolding <= 0}>Sat</button>
            </div>
          </article>
        </section>

        <section className="panel market-panel" id="markets">
          <div className="panel-head market-panel-head">
            <div>
              <span className="section-kicker">PİYASALAR</span>
              <h1>Canlı varlıklar <small>{filteredPrices.length} piyasa</small></h1>
            </div>
            <div className="market-tools">
              <label className="market-search">
                <Search size={15} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Coin ara: BTC, ETH, SOL…" aria-label="Coin ara" />
              </label>
              <button className="refresh-button" type="button" onClick={() => loadPrices()} disabled={loading.prices} aria-label="Fiyatları yenile">
                <RefreshCw size={15} className={loading.prices ? 'spin' : ''} />
                <span>Yenile</span>
              </button>
            </div>
          </div>

          <div className="market-table-head">
            <span>Varlık</span><span>Fiyat</span><span>24 saat</span><span>Güncellendi</span><span />
          </div>
          <div className="market-list">
            {pagedPrices.length ? pagedPrices.map((asset) => {
              const meta = assetMeta(asset.symbol)
              const change = Number(asset.changePercent ?? 0)
              return (
                <button className={`market-row ${selectedMeta.symbol === meta.symbol ? 'selected' : ''}`} key={`${asset.symbol}-${asset.pair}`} type="button" onClick={() => {
                  setSelectedSymbol(meta.symbol)
                  openTrade(asset)
                }}>
                  <span className="asset-cell">
                    <i className="asset-icon" style={{ background: meta.color }}>{meta.code}</i>
                    <span><strong>{meta.name}</strong><small>{meta.symbol} / USDT</small></span>
                  </span>
                  <strong className="mono-value">{formatMoney(asset.price)}</strong>
                  <span className={`change-pill ${change >= 0 ? 'positive' : 'negative'}`}>
                    {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {formatPercent(change)}
                  </span>
                  <span className="updated-cell">{formatDate(asset.updatedAt)}</span>
                  <span className="trade-link">İşlem yap <ChevronRight size={14} /></span>
                </button>
              )
            }) : (
              <EmptyState icon={<Search size={20} />} title="Eşleşen coin bulunamadı" text="Arama ifadenizi değiştirip tekrar deneyin." />
            )}
          </div>
          <div className="market-pagination">
            <span>{filteredPrices.length ? `${(activePage - 1) * PAGE_SIZE + 1}-${Math.min(activePage * PAGE_SIZE, filteredPrices.length)} / ${filteredPrices.length}` : '0 sonuç'}</span>
            <div>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={activePage === 1}><ArrowLeft size={13} /> Önceki</button>
              <b>{activePage} / {totalPages}</b>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={activePage === totalPages}>Sonraki <ArrowRight size={13} /></button>
            </div>
          </div>
        </section>

        <section className="portfolio-grid" id="portfolio">
          <article className="panel holdings-panel">
            <div className="panel-head">
              <div><span className="section-kicker">CÜZDAN</span><h2>Varlıklarım</h2></div>
              <span className="count-badge">{portfolio?.holdings?.filter((item) => Number(item.quantity) > 0).length ?? 0}</span>
            </div>
            <PortfolioHoldings portfolio={portfolio} prices={prices} summary={summary} />
          </article>

          <article className="panel orders-panel">
            <div className="panel-head">
              <div><span className="section-kicker">HAREKETLER</span><h2>Son işlemler</h2></div>
              <History size={18} />
            </div>
            <RecentOrders transactions={portfolio?.recentTransactions ?? []} />
          </article>
        </section>

        <footer>
          <span>CryptoPal</span>
          <small>Piyasa verileri bilgilendirme amaçlıdır.</small>
          <span className={averageChange >= 0 ? 'positive' : 'negative'}>Piyasa ortalaması {formatPercent(averageChange)}</span>
        </footer>
      </main>

      {assistantOpen && (
        <div className="assistant-layer">
          <button className="assistant-scrim" type="button" aria-label="Piyasa asistanını kapat" onClick={() => setAssistantOpen(false)} />
          <aside className="assistant-drawer" aria-label="Piyasa Asistanı">
            <header className="assistant-drawer-head">
              <div>
                <span className="assistant-mark"><MessageSquareText size={17} /></span>
                <span><small>CRYPTOPAL</small><strong>Piyasa Asistanı</strong></span>
              </div>
              <div className="assistant-head-actions">
                <span className="assistant-ready"><i /> PORTFÖY BAĞLI</span>
                <button type="button" onClick={() => setAssistantOpen(false)} aria-label="Kapat"><X size={17} /></button>
              </div>
            </header>
            <div className="assistant-messages" aria-live="polite">
              <div className="assistant-message assistant">
                <span><MessageSquareText size={13} /></span>
                <p>Merhaba. Portföyünüz, nakit oranınız, varlık dağılımınız ve son işlemleriniz hakkında soru sorabilirsiniz.</p>
              </div>
              {messages.map((chatMessage) => (
                <div className={`assistant-message ${chatMessage.role}`} key={chatMessage.id}>
                  {chatMessage.role === 'assistant' && <span><MessageSquareText size={13} /></span>}
                  <p>{chatMessage.text}</p>
                </div>
              ))}
              {loading.ai && (
                <div className="assistant-message assistant">
                  <span><MessageSquareText size={13} /></span>
                  <p className="assistant-typing"><i /><i /><i /></p>
                </div>
              )}
            </div>
            <div className="assistant-suggestions">
              {assistantSuggestions.map((suggestion) => (
                <button type="button" key={suggestion} disabled={loading.ai} onClick={() => askAssistant(suggestion)}>{suggestion}</button>
              ))}
            </div>
            <form className="assistant-compose" onSubmit={handleAiSubmit}>
              <textarea
                maxLength={1000}
                value={aiQuestion}
                onChange={(event) => setAiQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    askAssistant()
                  }
                }}
                placeholder="Portföyünüz hakkında bir soru sorun…"
                rows={2}
                aria-label="Piyasa asistanına soru"
              />
              <button type="submit" disabled={loading.ai || !aiQuestion.trim()}><Send size={15} /> Gönder</button>
            </form>
            <small className="assistant-note">Yanıtlar bilgilendirme amaçlıdır, yatırım tavsiyesi değildir.</small>
          </aside>
        </div>
      )}

      {selectedAsset && (
        <div className="modal-layer">
          <button className="modal-scrim" type="button" aria-label="İşlem penceresini kapat" onClick={() => setSelectedAsset(null)} />
          <form className="trade-modal" onSubmit={handleTradeSubmit} role="dialog" aria-modal="true" aria-labelledby="trade-title">
            <div className="trade-modal-head">
              <div className="trade-asset">
                <i className="asset-icon large" style={{ background: assetMeta(selectedAsset.symbol).color }}>{assetMeta(selectedAsset.symbol).code}</i>
                <span><small>{assetMeta(selectedAsset.symbol).name}</small><h2 id="trade-title">{assetMeta(selectedAsset.symbol).symbol} işlemi</h2></span>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelectedAsset(null)} aria-label="Kapat"><X size={18} /></button>
            </div>
            <div className="segmented-control">
              <button className={tradeType === 'BUY' ? 'active buy' : ''} type="button" onClick={() => { setTradeType('BUY'); setQuantity('') }}>Al</button>
              <button className={tradeType === 'SELL' ? 'active sell' : ''} type="button" disabled={heldQuantity <= 0} onClick={() => { setTradeType('SELL'); setQuantity('') }}>Sat</button>
            </div>
            <div className="trade-balance-row">
              <span>{tradeType === 'BUY' ? 'Kullanılabilir nakit' : 'Kullanılabilir miktar'}</span>
              <strong>{tradeType === 'BUY' ? formatMoney(portfolio?.fiatBalance) : `${formatCrypto(heldQuantity)} ${tradeSymbol}`}</strong>
            </div>
            <label className="quantity-field">
              <span>Miktar</span>
              <div><input autoFocus min="0.0000000001" step="0.0000000001" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /><b>{tradeSymbol}</b></div>
            </label>
            <div className="quick-percentages">
              {[0.25, 0.5, 0.75, 1].map((percent) => (
                <button type="button" key={percent} onClick={() => setQuantityFromPercent(percent)}>%{percent * 100}</button>
              ))}
            </div>
            <div className="trade-summary">
              <span><small>Piyasa fiyatı</small><strong>{formatMoney(tradePrice)}</strong></span>
              <span><small>Tahmini toplam</small><strong>{formatMoney(estimate)}</strong></span>
            </div>
            <p className="execution-note"><Activity size={13} /> İşlem, gönderildiği anda sunucudaki güncel piyasa fiyatıyla gerçekleşir.</p>
            <button className={`primary-action ${tradeType === 'SELL' ? 'sell-action' : ''}`} type="submit" disabled={loading.trade || invalidTrade}>
              {loading.trade ? 'İşleniyor…' : `${tradeSymbol} ${tradeType === 'BUY' ? 'alımını' : 'satışını'} tamamla`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

function AuthScreen({ authForm, authMode, error, loading, message, onDismiss, onFormChange, onModeChange, onRefresh, onSubmit, prices }) {
  return (
    <main className="auth-page">
      {(error || message) && (
        <div className={`notice-toast auth-notice ${error ? 'error' : 'success'}`} role="status">
          {error ? <Activity size={16} /> : <CheckCircle2 size={16} />}
          <span>{error || message}</span>
          <button type="button" onClick={onDismiss} aria-label="Bildirimi kapat"><X size={15} /></button>
        </div>
      )}
      <section className="auth-showcase">
        <a className="brand auth-brand" href="#"><span className="brand-mark">C</span><span><strong>CryptoPal</strong><small>market intelligence</small></span></a>
        <div className="auth-copy">
          <span className="section-kicker">PİYASAYI TEK EKRANDAN İZLEYİN</span>
          <h1>Portföyünüz için sade ve canlı bir işlem alanı.</h1>
          <p>Güncel fiyatları takip edin, varlık dağılımınızı görün ve portföyünüz hakkında sorular sorun.</p>
          <div className="auth-features">
            <span><Activity size={17} /> 15 saniyelik fiyat akışı</span>
            <span><WalletCards size={17} /> Portföy ve işlem geçmişi</span>
            <span><MessageSquareText size={17} /> Portföy bağlamlı asistan</span>
          </div>
        </div>
        <div className="auth-market-preview">
          <div className="preview-head"><span><i /> PİYASA CANLI</span><button type="button" onClick={() => onRefresh()} aria-label="Fiyatları yenile"><RefreshCw size={14} className={loading.prices ? 'spin' : ''} /></button></div>
          {prices.slice(0, 3).map((asset) => {
            const meta = assetMeta(asset.symbol)
            const change = Number(asset.changePercent ?? 0)
            return <div className="preview-row" key={asset.symbol}><span><i className="asset-icon" style={{ background: meta.color }}>{meta.code}</i><b>{meta.symbol}</b></span><strong>{formatMoney(asset.price)}</strong><small className={change >= 0 ? 'positive' : 'negative'}>{formatPercent(change)}</small></div>
          })}
          {!prices.length && <div className="preview-loading">Piyasa verisi bekleniyor…</div>}
        </div>
      </section>

      <section className="auth-form-side">
        <form className="auth-card" onSubmit={onSubmit}>
          <span className="auth-icon"><LogIn size={20} /></span>
          <div><span className="section-kicker">HESAP</span><h2>{authMode === 'login' ? 'Tekrar hoş geldiniz' : 'Yeni hesap oluşturun'}</h2><p>{authMode === 'login' ? 'Portföyünüze devam etmek için giriş yapın.' : 'Birkaç saniye içinde hesabınızı hazırlayın.'}</p></div>
          <div className="segmented-control auth-segment">
            <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => onModeChange('login')}>Giriş yap</button>
            <button className={authMode === 'register' ? 'active' : ''} type="button" onClick={() => onModeChange('register')}>Kayıt ol</button>
          </div>
          <label><span>E-posta</span><input autoComplete="email" type="email" value={authForm.email} onChange={(event) => onFormChange((current) => ({ ...current, email: event.target.value }))} placeholder="ornek@email.com" required /></label>
          <label><span>Şifre</span><input autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} type="password" minLength={6} maxLength={100} value={authForm.password} onChange={(event) => onFormChange((current) => ({ ...current, password: event.target.value }))} placeholder="En az 6 karakter" required /></label>
          <button className="primary-action" type="submit" disabled={loading.auth}>{loading.auth ? 'Lütfen bekleyin…' : authMode === 'login' ? 'Hesabıma giriş yap' : 'Hesabımı oluştur'} <ArrowRight size={16} /></button>
          <small className="auth-footnote"><ShieldCheck size={13} /> Oturumunuz güvenli bağlantı üzerinden korunur.</small>
        </form>
      </section>
    </main>
  )
}

function PriceChart({ history, loading }) {
  const chartData = history.map((point) => ({
    ...point,
    price: Number(point.price),
    time: formatDate(point.capturedAt),
  }))

  if (loading && chartData.length === 0) {
    return <div className="chart-state"><RefreshCw className="spin" size={18} /> Grafik yükleniyor</div>
  }
  if (chartData.length === 0) {
    return <div className="chart-state"><BarChart3 size={19} /> Fiyat geçmişi oluştuğunda grafik burada görünecek.</div>
  }

  return (
    <div className="price-chart">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={chartData} margin={{ bottom: 0, left: -12, right: 8, top: 12 }}>
          <CartesianGrid stroke="rgba(190, 231, 206, 0.08)" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="time" minTickGap={30} stroke="#4f675a" tick={{ fill: '#6f887b', fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis domain={['auto', 'auto']} stroke="#4f675a" tick={{ fill: '#6f887b', fontSize: 9 }} tickFormatter={(value) => Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} tickLine={false} axisLine={false} width={64} />
          <Tooltip formatter={(value) => [formatMoney(value), 'Fiyat']} labelFormatter={(label) => `Saat ${label}`} contentStyle={{ background: '#0d1d15', border: '1px solid rgba(190, 231, 206, 0.13)', borderRadius: 10, color: '#dce9e1', fontSize: 11 }} labelStyle={{ color: '#7f998a' }} />
          <Line dataKey="price" dot={false} isAnimationActive={false} stroke="#7dfab2" strokeWidth={2.3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function PortfolioHoldings({ portfolio, prices, summary }) {
  const priceMap = new Map(prices.map((asset) => [assetMeta(asset.symbol).symbol, Number(asset.price)]))
  const holdings = (portfolio?.holdings ?? []).filter((holding) => Number(holding.quantity) > 0)
  if (!holdings.length) {
    return <EmptyState icon={<Coins size={21} />} title="Henüz kripto varlığınız yok" text="Piyasa listesinden bir coin seçerek ilk işleminizi yapabilirsiniz." />
  }

  return (
    <div className="holdings-content">
      <div className="donut-wrap">
        <div className="donut-chart" style={{ background: buildPieGradient(summary.allocations) }}><div><small>Kripto değeri</small><strong>{formatMoney(summary.holdingsValue)}</strong></div></div>
      </div>
      <div className="holdings-list">
        {holdings.map((holding) => {
          const meta = assetMeta(holding.symbol)
          const value = Number(holding.quantity) * (priceMap.get(meta.symbol) ?? 0)
          return <div className="holding-row" key={holding.symbol}><span className="asset-cell"><i className="asset-dot" style={{ background: meta.color }} /><span><strong>{meta.symbol}</strong><small>{formatCrypto(holding.quantity)} adet</small></span></span><strong>{formatMoney(value)}</strong></div>
        })}
      </div>
    </div>
  )
}

function RecentOrders({ transactions }) {
  if (!transactions.length) {
    return <EmptyState icon={<History size={21} />} title="Henüz işlem yok" text="Alım veya satım işlemleriniz burada listelenecek." />
  }
  return (
    <div className="orders-list">
      {transactions.slice(0, 6).map((transaction) => {
        const meta = assetMeta(transaction.symbol)
        const isBuy = transaction.type === 'BUY'
        return <div className="order-row" key={transaction.id}><span className={`order-icon ${isBuy ? 'buy' : 'sell'}`}>{isBuy ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}</span><span><strong>{meta.symbol} {isBuy ? 'alımı' : 'satışı'}</strong><small>{formatDate(transaction.createdAt, true)} · {formatCrypto(transaction.quantity)} {meta.symbol}</small></span><span><strong>{formatMoney(transaction.totalAmount)}</strong><small>@ {formatMoney(transaction.executionPrice)}</small></span></div>
      })}
    </div>
  )
}

function EmptyState({ icon, title, text }) {
  return <div className="empty-state"><span>{icon}</span><div><strong>{title}</strong><p>{text}</p></div></div>
}

export default App
