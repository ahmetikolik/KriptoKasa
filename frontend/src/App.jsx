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
  changePassword,
  deleteAccount,
  executeTrade,
  getAccount,
  getPortfolio,
  getPriceHistory,
  getPrices,
  login,
  queryAi,
  register,
  updateAccount,
} from './api/client'
import './App.css'

const emptyAuth = { email: '', password: '' }
const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' }
const emptyDeleteForm = { emailConfirmation: '', password: '' }

const currencyMeta = {
  TRY: { locale: 'tr-TR', label: 'TL' },
  USD: { locale: 'en-US', label: 'USD' },
  EUR: { locale: 'de-DE', label: 'EUR' },
}

const fallbackRates = { USD: 1, TRY: 33, EUR: 0.92 }
const languageOptions = ['tr', 'en', 'de', 'fr']
const currencyOptions = ['TRY', 'USD', 'EUR']
const stableSymbols = new Set(['USDT', 'USDC'])
const majorSymbols = new Set(['BTC', 'ETH', 'BNB', 'SOL', 'XRP'])

const copy = {
  tr: {
    brand: 'CryptoVault',
    markets: 'Piyasalar',
    trade: 'Al-Sat',
    wallet: 'Cüzdan',
    login: 'Giriş Yap',
    create: 'Hesap Oluştur',
    settings: 'Hesap Ayarları',
    overview: 'Piyasa Genel Bakış',
    subtitle: 'Canlı coin verileri, favoriler, cüzdan işlemleri ve yapay zeka tek ekranda.',
    all: 'Tümü',
    portfolio: 'Portföyüm',
    gainers: 'Kazananlar',
    stable: 'Stable Coin',
    majors: 'Büyük Coinler',
    favorites: 'Favoriler',
    noFavorites: 'Favori coin eklemek için yıldızı kullan.',
    search: 'Coin ara',
    coin: 'Coin',
    price: 'Fiyat',
    change: '24s Değişim',
    updated: 'Piyasa Zamanı',
    delayed: 'Piyasa Fiyatı',
    balance: 'Cüzdan',
    action: 'İşlem',
    buy: 'Satın Al',
    sell: 'Sat',
    quantity: 'Miktar',
    estimate: 'Tahmini Toplam',
    delayedNote: 'Emirler güncel piyasa fiyatıyla çalışır.',
    account: 'Hesap',
    email: 'E-posta',
    password: 'Şifre',
    signedIn: 'Oturum',
    signOut: 'Çıkış Yap',
    preferences: 'Tercihler',
    language: 'Dil',
    currency: 'Para Birimi',
    theme: 'Tema',
    light: 'Aydınlık',
    dark: 'Karanlık',
    displayName: 'Ad Soyad',
    phone: 'Telefon No',
    updateProfile: 'Profili Güncelle',
    security: 'Güvenlik',
    currentPassword: 'Mevcut şifre',
    newPassword: 'Yeni şifre',
    confirmPassword: 'Yeni şifre tekrar',
    changePassword: 'Şifreyi Güncelle',
    deleteAccount: 'Hesabı Sil',
    confirmDelete: 'Silmek için e-postanı ve şifreni gir.',
    recentOrders: 'Son İşlemler',
    noOrders: 'Henüz işlem yok.',
    noHoldings: 'Coin bakiyen yok.',
    loginToTrade: 'İşlem yapmak için giriş yap.',
    authSuccess: 'Oturum açıldı.',
    registerSuccess: 'Hesap oluşturuldu.',
    signedOut: 'Çıkış yapıldı.',
    profileUpdated: 'Hesap bilgileri güncellendi.',
    passwordUpdated: 'Şifre güncellendi.',
    accountDeleted: 'Hesap silindi.',
    executed: 'emri gerçekleşti',
    loading: 'Yükleniyor',
    refresh: 'Verileri Yenile',
    chart: 'Fiyat Grafiği',
    execute: 'Emri Gerçekleştir',
    ai: 'AI Piyasa Asistanı',
    aiPlaceholder: 'Portföyüm ve son piyasa hareketleri hakkında yorum yap.',
    askAi: 'AI ile Analiz Et',
    aiLogin: 'AI analizi için giriş yap.',
    rateSource: 'Kur kaynağı',
    details: 'Detay',
    openChat: 'AI Sohbet',
    close: 'Kapat',
    dragChat: 'Taşımak için sürükle',
    holdings: 'Varlıklarım',
    cashBalance: 'Nakit Bakiye',
  },
  en: {
    brand: 'CryptoVault',
    markets: 'Markets',
    trade: 'Trade',
    wallet: 'Wallet',
    login: 'Login',
    create: 'Create Account',
    settings: 'Account Settings',
    overview: 'Market Overview',
    subtitle: 'Live coin data, favorites, wallet actions, and AI in one screen.',
    all: 'All',
    portfolio: 'Portfolio',
    gainers: 'Gainers',
    stable: 'Stable Coin',
    majors: 'Majors',
    favorites: 'Favorites',
    noFavorites: 'Use the star to add favorites.',
    search: 'Search coin',
    coin: 'Coin',
    price: 'Price',
    change: '24h Change',
    updated: 'Market Time',
    delayed: 'Market Price',
    balance: 'Wallet',
    action: 'Action',
    buy: 'Buy',
    sell: 'Sell',
    quantity: 'Quantity',
    estimate: 'Estimated Total',
    delayedNote: 'Orders execute with the current market price.',
    account: 'Account',
    email: 'Email',
    password: 'Password',
    signedIn: 'Session',
    signOut: 'Sign Out',
    preferences: 'Preferences',
    language: 'Language',
    currency: 'Currency',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    displayName: 'Full Name',
    phone: 'Phone',
    updateProfile: 'Update Profile',
    security: 'Security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    changePassword: 'Change Password',
    deleteAccount: 'Delete Account',
    confirmDelete: 'Enter your email and password to delete.',
    recentOrders: 'Recent Orders',
    noOrders: 'No orders yet.',
    noHoldings: 'No coin balance.',
    loginToTrade: 'Login to trade.',
    authSuccess: 'Signed in.',
    registerSuccess: 'Account created.',
    signedOut: 'Signed out.',
    profileUpdated: 'Account updated.',
    passwordUpdated: 'Password updated.',
    accountDeleted: 'Account deleted.',
    executed: 'order executed',
    loading: 'Loading',
    refresh: 'Refresh Data',
    chart: 'Price Chart',
    execute: 'Execute Order',
    ai: 'AI Market Assistant',
    aiPlaceholder: 'Analyze my portfolio and recent market movement.',
    askAi: 'Ask AI',
    aiLogin: 'Login to use AI analysis.',
    rateSource: 'Rate source',
    details: 'Details',
    openChat: 'AI Chat',
    close: 'Close',
    dragChat: 'Drag to move',
    holdings: 'Holdings',
    cashBalance: 'Cash Balance',
  },
  de: {
    brand: 'CryptoVault',
    markets: 'Märkte',
    trade: 'Handeln',
    wallet: 'Wallet',
    login: 'Einloggen',
    create: 'Konto Erstellen',
    settings: 'Kontoeinstellungen',
    overview: 'Marktübersicht',
    subtitle: 'Live-Coin-Daten, Favoriten, Wallet-Aktionen und KI auf einem Bildschirm.',
    all: 'Alle',
    portfolio: 'Portfolio',
    gainers: 'Gewinner',
    stable: 'Stable Coin',
    majors: 'Große Coins',
    favorites: 'Favoriten',
    noFavorites: 'Mit dem Stern Favoriten hinzufügen.',
    search: 'Coin suchen',
    coin: 'Coin',
    price: 'Preis',
    change: '24h Änderung',
    updated: 'Marktzeit',
    delayed: 'Marktpreis',
    balance: 'Wallet',
    action: 'Aktion',
    buy: 'Kaufen',
    sell: 'Verkaufen',
    quantity: 'Menge',
    estimate: 'Gesamtwert',
    delayedNote: 'Orders nutzen den aktuellen Marktpreis.',
    account: 'Konto',
    email: 'E-Mail',
    password: 'Passwort',
    signedIn: 'Sitzung',
    signOut: 'Abmelden',
    preferences: 'Einstellungen',
    language: 'Sprache',
    currency: 'Währung',
    theme: 'Theme',
    light: 'Hell',
    dark: 'Dunkel',
    displayName: 'Name',
    phone: 'Telefon',
    updateProfile: 'Profil Aktualisieren',
    security: 'Sicherheit',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Bestätigen',
    changePassword: 'Passwort Ändern',
    deleteAccount: 'Konto Löschen',
    confirmDelete: 'E-Mail und Passwort zum Löschen eingeben.',
    recentOrders: 'Letzte Orders',
    noOrders: 'Noch keine Orders.',
    noHoldings: 'Kein Coin-Guthaben.',
    loginToTrade: 'Zum Handeln einloggen.',
    authSuccess: 'Eingeloggt.',
    registerSuccess: 'Konto erstellt.',
    signedOut: 'Abgemeldet.',
    profileUpdated: 'Konto aktualisiert.',
    passwordUpdated: 'Passwort aktualisiert.',
    accountDeleted: 'Konto gelöscht.',
    executed: 'Order ausgeführt',
    loading: 'Lädt',
    refresh: 'Daten Aktualisieren',
    chart: 'Preischart',
    execute: 'Order Ausführen',
    ai: 'KI-Marktassistent',
    aiPlaceholder: 'Analysiere mein Portfolio und den Markt.',
    askAi: 'KI Fragen',
    aiLogin: 'Zum KI-Chat einloggen.',
    rateSource: 'Kursquelle',
    details: 'Details',
    openChat: 'KI Chat',
    close: 'Schließen',
    dragChat: 'Zum Verschieben ziehen',
    holdings: 'Bestände',
    cashBalance: 'Barbestand',
  },
  fr: {
    brand: 'CryptoVault',
    markets: 'Marchés',
    trade: 'Trader',
    wallet: 'Portefeuille',
    login: 'Connexion',
    create: 'Créer un Compte',
    settings: 'Paramètres',
    overview: 'Vue du Marché',
    subtitle: 'Données crypto, favoris, actions portefeuille et IA sur un seul écran.',
    all: 'Tous',
    portfolio: 'Portefeuille',
    gainers: 'Hausses',
    stable: 'Stable Coin',
    majors: 'Grands Coins',
    favorites: 'Favoris',
    noFavorites: 'Utilise l’étoile pour ajouter des favoris.',
    search: 'Rechercher',
    coin: 'Coin',
    price: 'Prix',
    change: 'Variation 24h',
    updated: 'Heure Marché',
    delayed: 'Prix Marché',
    balance: 'Solde',
    action: 'Action',
    buy: 'Acheter',
    sell: 'Vendre',
    quantity: 'Quantité',
    estimate: 'Total Estimé',
    delayedNote: 'Les ordres utilisent le prix actuel du marché.',
    account: 'Compte',
    email: 'E-mail',
    password: 'Mot de passe',
    signedIn: 'Session',
    signOut: 'Déconnexion',
    preferences: 'Préférences',
    language: 'Langue',
    currency: 'Devise',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    displayName: 'Nom',
    phone: 'Téléphone',
    updateProfile: 'Mettre à Jour',
    security: 'Sécurité',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer',
    changePassword: 'Changer le Mot de Passe',
    deleteAccount: 'Supprimer le Compte',
    confirmDelete: 'Entre e-mail et mot de passe pour supprimer.',
    recentOrders: 'Ordres Récents',
    noOrders: 'Aucun ordre.',
    noHoldings: 'Aucun solde crypto.',
    loginToTrade: 'Connecte-toi pour trader.',
    authSuccess: 'Connecté.',
    registerSuccess: 'Compte créé.',
    signedOut: 'Déconnecté.',
    profileUpdated: 'Compte mis à jour.',
    passwordUpdated: 'Mot de passe mis à jour.',
    accountDeleted: 'Compte supprimé.',
    executed: 'ordre exécuté',
    loading: 'Chargement',
    refresh: 'Actualiser',
    chart: 'Graphique',
    execute: 'Exécuter',
    ai: 'Assistant Marché IA',
    aiPlaceholder: 'Analyse mon portefeuille et le marché récent.',
    askAi: 'Demander à l’IA',
    aiLogin: 'Connexion requise pour l’IA.',
    rateSource: 'Source taux',
    details: 'Détails',
    openChat: 'Chat IA',
    close: 'Fermer',
    dragChat: 'Glisser pour déplacer',
    holdings: 'Actifs',
    cashBalance: 'Solde Cash',
  },
}

const coinNames = {
  ADA: 'Cardano',
  APT: 'Aptos',
  ARB: 'Arbitrum',
  ATOM: 'Cosmos',
  AVAX: 'Avalanche',
  BCH: 'Bitcoin Cash',
  BNB: 'BNB',
  BTC: 'Bitcoin',
  DOGE: 'Dogecoin',
  DOT: 'Polkadot',
  ETC: 'Ethereum Classic',
  ETH: 'Ethereum',
  FIL: 'Filecoin',
  LINK: 'Chainlink',
  LTC: 'Litecoin',
  NEAR: 'NEAR Protocol',
  SOL: 'Solana',
  TRX: 'TRON',
  UNI: 'Uniswap',
  USDC: 'USD Coin',
  USDT: 'TetherUS',
  XRP: 'XRP',
}

const coinIconOverrides = {
  APT: 'https://coin-images.coingecko.com/coins/images/26455/large/Aptos-Network-Symbol-Black-RGB-1x.png?1761789140',
  ARB: 'https://coin-images.coingecko.com/coins/images/16547/large/arb.jpg?1721358242',
  NEAR: 'https://coin-images.coingecko.com/coins/images/10365/large/near.jpg?1696510367',
}

function CoinIcon({ symbol, size = 'medium' }) {
  const [failed, setFailed] = useState(false)
  const source =
    coinIconOverrides[symbol] ??
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${symbol.toLowerCase()}.svg`

  return (
    <span className={`coin-icon ${size}`} aria-label={`${symbol} logo`}>
      {failed ? (
        <span>{symbol.slice(0, 2)}</span>
      ) : (
        <img alt="" loading="lazy" onError={() => setFailed(true)} src={source} />
      )}
    </span>
  )
}

function formatCrypto(value) {
  return Number(value ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 10 })
}

function formatPercent(value) {
  const number = Number(value ?? 0)
  const sign = number > 0 ? '+' : ''
  return `${sign}${number.toFixed(2)}%`
}

function convertUsd(value, currency, rates) {
  return Number(value ?? 0) * Number(rates[currency] ?? 1)
}

function formatMoney(value, currency, rates) {
  const meta = currencyMeta[currency]
  return convertUsd(value, currency, rates).toLocaleString(meta.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  })
}

function buildPortfolioSummary(portfolio, prices) {
  if (!portfolio) {
    return { holdingsValue: 0, totalValue: 0 }
  }
  const priceMap = new Map(prices.map((price) => [price.symbol, Number(price.price)]))
  const holdingsValue = portfolio.holdings.reduce((total, holding) => {
    return total + Number(holding.quantity) * Number(priceMap.get(holding.symbol) ?? 0)
  }, 0)
  return {
    holdingsValue,
    totalValue: Number(portfolio.fiatBalance ?? 0) + holdingsValue,
  }
}

function applyDefaultPreferences() {
  if (localStorage.getItem('cryptopal-defaults-v5') === '1') {
    return
  }
  localStorage.setItem('cryptopal-language', 'tr')
  localStorage.setItem('cryptopal-currency', 'USD')
  localStorage.setItem('cryptopal-theme', 'dark')
  localStorage.setItem('cryptopal-defaults-v5', '1')
}

function App() {
  applyDefaultPreferences()
  const [language, setLanguage] = useState(() => localStorage.getItem('cryptopal-language') ?? 'tr')
  const [currency, setCurrency] = useState(() => localStorage.getItem('cryptopal-currency') ?? 'USD')
  const [theme, setTheme] = useState(() => localStorage.getItem('cryptopal-theme') ?? 'dark')
  const [rates, setRates] = useState(fallbackRates)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem('cryptopal-session')
    return stored ? JSON.parse(stored) : null
  })
  const [account, setAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({ displayName: '', phoneNumber: '' })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [deleteForm, setDeleteForm] = useState(emptyDeleteForm)
  const [prices, setPrices] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [tradeType, setTradeType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('cryptopal-favorites')
    return stored ? JSON.parse(stored) : ['BTC', 'ETH', 'SOL']
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiOpen, setAiOpen] = useState(true)
  const [aiPosition, setAiPosition] = useState(() => {
    const stored = localStorage.getItem('cryptopal-ai-position')
    if (!stored) return { bottom: 24, right: 24 }
    try {
      return JSON.parse(stored)
    } catch {
      return { bottom: 24, right: 24 }
    }
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState({
    account: false,
    ai: false,
    auth: false,
    history: false,
    portfolio: false,
    prices: false,
    rates: false,
    settings: false,
    trade: false,
  })

  const t = copy[language] ?? copy.tr
  const token = session?.token

  const loadPrices = useCallback(async () => {
    setLoading((current) => ({ ...current, prices: true }))
    try {
      setPrices(await getPrices())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, prices: false }))
    }
  }, [])

  const loadRates = useCallback(async () => {
    setLoading((current) => ({ ...current, rates: true }))
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY,EUR')
      if (!response.ok) {
        throw new Error('Rate service unavailable')
      }
      const data = await response.json()
      setRates({ USD: 1, TRY: Number(data.rates.TRY), EUR: Number(data.rates.EUR) })
    } catch {
      setRates((current) => current)
    } finally {
      setLoading((current) => ({ ...current, rates: false }))
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

  const loadAccount = useCallback(async () => {
    if (!token) {
      setAccount(null)
      setAccountForm({ displayName: '', phoneNumber: '' })
      return
    }
    setLoading((current) => ({ ...current, account: true }))
    try {
      const data = await getAccount(token)
      setAccount(data)
      setAccountForm({
        displayName: data.displayName ?? '',
        phoneNumber: data.phoneNumber ?? '',
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, account: false }))
    }
  }, [token])

  const loadPriceHistory = useCallback(async (symbol) => {
    if (!symbol) {
      setPriceHistory([])
      return
    }
    setLoading((current) => ({ ...current, history: true }))
    try {
      setPriceHistory(await getPriceHistory(symbol))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, history: false }))
    }
  }, [])

  useEffect(() => {
    loadPrices()
    const intervalId = window.setInterval(loadPrices, 5_000)
    return () => window.clearInterval(intervalId)
  }, [loadPrices])

  useEffect(() => {
    loadRates()
    const intervalId = window.setInterval(loadRates, 5_000)
    return () => window.clearInterval(intervalId)
  }, [loadRates])

  useEffect(() => {
    loadPortfolio()
    const intervalId = window.setInterval(loadPortfolio, 5_000)
    return () => window.clearInterval(intervalId)
  }, [loadPortfolio])

  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  useEffect(() => {
    localStorage.setItem('cryptopal-language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('cryptopal-currency', currency)
  }, [currency])

  useEffect(() => {
    localStorage.setItem('cryptopal-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('cryptopal-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('cryptopal-ai-position', JSON.stringify(aiPosition))
  }, [aiPosition])

  useEffect(() => {
    if (!selectedSymbol && prices.length > 0) {
      setSelectedSymbol(prices.find((price) => price.symbol === 'BTC')?.symbol ?? prices[0].symbol)
    }
  }, [prices, selectedSymbol])

  const selectedAsset = useMemo(() => {
    return prices.find((asset) => asset.symbol === selectedSymbol) ?? prices[0] ?? null
  }, [prices, selectedSymbol])

  useEffect(() => {
    const symbol = selectedAsset?.symbol
    if (!symbol) {
      setPriceHistory([])
      return undefined
    }
    loadPriceHistory(symbol)
    const intervalId = window.setInterval(() => loadPriceHistory(symbol), 5_000)
    return () => window.clearInterval(intervalId)
  }, [loadPriceHistory, selectedAsset?.symbol])

  const holdingsBySymbol = useMemo(() => {
    const map = new Map()
    portfolio?.holdings?.forEach((holding) => map.set(holding.symbol, Number(holding.quantity)))
    return map
  }, [portfolio])

  const filteredPrices = useMemo(() => {
    const query = searchTerm.trim().toUpperCase()
    return prices
      .filter((asset) => {
        if (activeFilter === 'portfolio' && !holdingsBySymbol.has(asset.symbol)) return false
        if (activeFilter === 'gainers' && Number(asset.changePercent ?? 0) <= 0) return false
        if (activeFilter === 'stable' && !stableSymbols.has(asset.symbol)) return false
        if (activeFilter === 'majors' && !majorSymbols.has(asset.symbol)) return false
        if (!query) return true
        return asset.symbol.includes(query) || (coinNames[asset.symbol] ?? '').toUpperCase().includes(query)
      })
      .sort((a, b) => {
        if (activeFilter === 'gainers') return Number(b.changePercent ?? 0) - Number(a.changePercent ?? 0)
        return a.symbol.localeCompare(b.symbol)
      })
  }, [activeFilter, holdingsBySymbol, prices, searchTerm])

  const favoriteAssets = useMemo(() => prices.filter((asset) => favorites.includes(asset.symbol)), [favorites, prices])
  const executionPrice = Number(selectedAsset?.price ?? 0)
  const estimateUsd = Number(quantity || 0) * executionPrice
  const summary = useMemo(() => buildPortfolioSummary(portfolio, prices), [portfolio, prices])
  const canSellSelected = Number(holdingsBySymbol.get(selectedAsset?.symbol) ?? 0) > 0
  const walletHoldings = useMemo(() => {
    return (portfolio?.holdings ?? []).map((holding) => {
      const asset = prices.find((price) => price.symbol === holding.symbol)
      return {
        asset,
        quantity: Number(holding.quantity),
        symbol: holding.symbol,
        valueUsd: Number(holding.quantity) * Number(asset?.price ?? 0),
      }
    })
  }, [portfolio, prices])
  const quickTradeAssets = favoriteAssets.length > 0 ? favoriteAssets : prices.slice(0, 5)
  const aiWidgetStyle = aiPosition.left == null
    ? { bottom: `${aiPosition.bottom ?? 24}px`, right: `${aiPosition.right ?? 24}px` }
    : { left: `${aiPosition.left}px`, top: `${aiPosition.top}px` }

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
      setAuthForm(emptyAuth)
      setMessage(authMode === 'login' ? t.authSuccess : t.registerSuccess)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, auth: false }))
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    if (!token) return
    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, settings: true }))
    try {
      const data = await updateAccount(token, accountForm)
      setAccount(data)
      setMessage(t.profileUpdated)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, settings: false }))
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    if (!token) return
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Yeni şifre tekrar alanı eşleşmiyor')
      return
    }
    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, settings: true }))
    try {
      await changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(emptyPasswordForm)
      setMessage(t.passwordUpdated)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, settings: false }))
    }
  }

  async function handleDeleteAccount(event) {
    event.preventDefault()
    if (!token) return
    setError('')
    setMessage('')
    setLoading((current) => ({ ...current, settings: true }))
    try {
      await deleteAccount(token, deleteForm)
      setSession(null)
      setAccount(null)
      setPortfolio(null)
      localStorage.removeItem('cryptopal-session')
      setSettingsOpen(false)
      setMessage(t.accountDeleted)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading((current) => ({ ...current, settings: false }))
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
        symbol: selectedAsset.symbol,
        type: tradeType,
        quantity: Number(quantity),
      })
      setMessage(`${response.symbol} ${t.executed}: ${formatCrypto(response.quantity)}`)
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
    if (!token) return
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

  function handleAiDragStart(event) {
    if (event.button !== 0) return
    const widget = event.currentTarget.closest('.floating-ai')
    if (!widget) return
    event.preventDefault()
    const startRect = widget.getBoundingClientRect()
    const offsetX = event.clientX - startRect.left
    const offsetY = event.clientY - startRect.top

    function moveWidget(moveEvent) {
      const width = widget.offsetWidth
      const height = widget.offsetHeight
      const left = Math.min(Math.max(moveEvent.clientX - offsetX, 12), window.innerWidth - width - 12)
      const top = Math.min(Math.max(moveEvent.clientY - offsetY, 12), window.innerHeight - height - 12)
      setAiPosition({ left, top })
    }

    function stopMove() {
      window.removeEventListener('pointermove', moveWidget)
      window.removeEventListener('pointerup', stopMove)
    }

    window.addEventListener('pointermove', moveWidget)
    window.addEventListener('pointerup', stopMove, { once: true })
  }

  function openAssetDialog(asset) {
    setSelectedSymbol(asset.symbol)
    setAssetDialogOpen(true)
    setQuantity('')
    setError('')
    setMessage('')
  }

  function toggleFavorite(symbol) {
    setFavorites((current) => (current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol]))
  }

  function signOut() {
    setSession(null)
    setAccount(null)
    setPortfolio(null)
    localStorage.removeItem('cryptopal-session')
    setMessage(t.signedOut)
  }

  return (
    <main className={`exchange-shell theme-${theme}`}>
      <header className="exchange-topbar">
        <button className="brand-mark" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="brand-glyph">CV</span>
          <strong>{t.brand}</strong>
        </button>
        <nav className="main-nav" aria-label="Primary">
          <a href="#markets">{t.markets}</a>
          <button type="button" onClick={() => setAiOpen(true)}>{t.ai}</button>
          <a href="#wallet-section">{t.wallet}</a>
        </nav>
        <div className="top-actions">
          <select aria-label={t.currency} value={currency} onChange={(event) => setCurrency(event.target.value)}>
            {currencyOptions.map((option) => <option key={option} value={option}>{currencyMeta[option].label}</option>)}
          </select>
          <select aria-label={t.language} value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languageOptions.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
          </select>
          <button className="theme-button" type="button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? t.light : t.dark}
          </button>
          <button className="primary-button compact" type="button" onClick={() => setSettingsOpen(true)}>{t.settings}</button>
        </div>
      </header>

      {(error || message) && <div className={error ? 'notice error' : 'notice success'}>{error || message}</div>}

      <section className="market-hero" id="markets">
        <div>
          <h1>{t.overview}</h1>
          <p>{t.subtitle}</p>
        </div>
        <button className="primary-button" type="button" onClick={() => { loadPrices(); loadRates(); }}>
          {loading.prices || loading.rates ? t.loading : t.refresh}
        </button>
      </section>

      <section className="exchange-layout">
        <div className="market-area">
          <div className="market-tabs" role="tablist" aria-label={t.markets}>
            {[
              ['all', t.all],
              ['portfolio', t.portfolio],
              ['gainers', t.gainers],
              ['stable', t.stable],
              ['majors', t.majors],
            ].map(([key, label]) => (
              <button className={activeFilter === key ? 'active' : ''} key={key} onClick={() => setActiveFilter(key)} type="button">
                {label}
              </button>
            ))}
          </div>

          <div className="market-toolbar">
            <input aria-label={t.search} placeholder={t.search} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </div>

          <div className="market-table" role="table">
            <div className="market-row market-head" role="row">
              <span>{t.coin}</span>
              <span>{t.price}</span>
              <span>{t.change}</span>
              <span>{t.updated}</span>
              <span>{t.balance}</span>
              <span>{t.action}</span>
            </div>
            {filteredPrices.map((asset) => {
              const trendClass = Number(asset.changePercent ?? 0) >= 0 ? 'up' : 'down'
              const isFavorite = favorites.includes(asset.symbol)
              const held = holdingsBySymbol.get(asset.symbol) ?? 0
              const isSelected = selectedAsset?.symbol === asset.symbol
              return (
                <div className={`market-row ${isSelected ? 'selected' : ''}`} key={asset.symbol} role="row">
                  <div className="coin-cell">
                    <button className={`star-button ${isFavorite ? 'active' : ''}`} aria-label={`${asset.symbol} favorite`} onClick={() => toggleFavorite(asset.symbol)} type="button">
                      ★
                    </button>
                    <CoinIcon symbol={asset.symbol} />
                    <button className="coin-name" onClick={() => openAssetDialog(asset)} type="button">
                      <strong>{asset.symbol}</strong>
                      <span>{coinNames[asset.symbol] ?? asset.pair}</span>
                    </button>
                  </div>
                  <strong className="price-cell">{formatMoney(asset.price, currency, rates)}</strong>
                  <span className={`change-cell ${trendClass}`}>{formatPercent(asset.changePercent)}</span>
                  <span>{new Date(asset.updatedAt).toLocaleTimeString(currencyMeta[currency].locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span>{formatCrypto(held)}</span>
                  <button className="trade-link" type="button" onClick={() => openAssetDialog(asset)}>{t.details}</button>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="right-rail">
          <section className="rail-panel favorites-panel">
            <div className="rail-heading">
              <h2>{t.favorites}</h2>
              <span>{favoriteAssets.length}</span>
            </div>
            {favoriteAssets.length === 0 ? (
              <div className="empty-state">{t.noFavorites}</div>
            ) : (
              <div className="favorite-list">
                {favoriteAssets.map((asset) => (
                  <button className="favorite-row" key={asset.symbol} onClick={() => openAssetDialog(asset)} type="button">
                    <CoinIcon size="small" symbol={asset.symbol} />
                    <span>{asset.symbol}</span>
                    <strong>{formatMoney(asset.price, currency, rates)}</strong>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rail-panel account-panel">
            <div className="rail-heading">
              <h2>{session ? t.signedIn : t.account}</h2>
            </div>
            {session ? (
              <div className="session-box">
                <strong className="session-email">{account?.displayName || session.email}</strong>
                <span className="muted">{account?.phoneNumber || t.noHoldings}</span>
                <div className="balance-stack">
                  <span>{t.wallet}</span>
                  <strong>{formatMoney(summary.totalValue, currency, rates)}</strong>
                </div>
                <button className="primary-button" type="button" onClick={() => setSettingsOpen(true)}>{t.settings}</button>
                <button className="secondary-button" type="button" onClick={signOut}>{t.signOut}</button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleAuthSubmit}>
                <div className="segmented-control">
                  <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => setAuthMode('login')}>{t.login}</button>
                  <button className={authMode === 'register' ? 'active' : ''} type="button" onClick={() => setAuthMode('register')}>{t.create}</button>
                </div>
                <label>{t.email}<input autoComplete="email" required type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} /></label>
                <label>{t.password}<input autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={6} required type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} /></label>
                <button className="primary-button" disabled={loading.auth} type="submit">{loading.auth ? t.loading : authMode === 'login' ? t.login : t.create}</button>
              </form>
            )}
          </section>
        </aside>
      </section>

      <section className="wallet-section" id="wallet-section">
        <div className="section-heading">
          <div>
            <span>{t.wallet}</span>
            <h2>{t.holdings}</h2>
          </div>
          {session && <strong>{formatMoney(summary.totalValue, currency, rates)}</strong>}
        </div>
        {session ? (
          <div className="wallet-grid">
            <div className="balance-stack wallet-cash">
              <span>{t.cashBalance}</span>
              <strong>{formatMoney(portfolio?.fiatBalance ?? 0, currency, rates)}</strong>
            </div>
            <div className="wallet-holdings">
              {walletHoldings.length === 0 ? (
                <div className="empty-state">{t.noHoldings}</div>
              ) : (
                walletHoldings.map((holding) => (
                  <div className="wallet-row" key={holding.symbol}>
                    <div className="coin-cell">
                      <CoinIcon size="small" symbol={holding.symbol} />
                      <div>
                        <strong>{holding.symbol}</strong>
                        <span>{formatCrypto(holding.quantity)}</span>
                      </div>
                    </div>
                    <strong>{formatMoney(holding.valueUsd, currency, rates)}</strong>
                    <button className="trade-link" disabled={!holding.asset} type="button" onClick={() => holding.asset && openAssetDialog(holding.asset)}>
                      {t.trade}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="quick-wallet-trades">
              {quickTradeAssets.map((asset) => (
                <button className="favorite-row" key={asset.symbol} type="button" onClick={() => openAssetDialog(asset)}>
                  <CoinIcon size="small" symbol={asset.symbol} />
                  <span>{asset.symbol}</span>
                  <strong>{formatMoney(asset.price, currency, rates)}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">{t.loginToTrade}</div>
        )}
      </section>

      {aiOpen ? (
        <section className="floating-ai open" style={aiWidgetStyle}>
          <header className="floating-ai-header" title={t.dragChat} onPointerDown={handleAiDragStart}>
            <div>
              <span>Gemini</span>
              <strong>{t.ai}</strong>
            </div>
            <button type="button" aria-label={t.close} onPointerDown={(event) => event.stopPropagation()} onClick={() => setAiOpen(false)}>×</button>
          </header>
          {session ? (
            <form className="ai-form floating-ai-body" onSubmit={handleAiSubmit}>
              <textarea value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder={t.aiPlaceholder} rows={4} maxLength={1000} required />
              <button className="primary-button" disabled={loading.ai || !aiQuestion.trim()} type="submit">{loading.ai ? t.loading : t.askAi}</button>
              {aiAnswer && <div className="ai-answer">{aiAnswer}</div>}
            </form>
          ) : (
            <div className="empty-state floating-ai-body">{t.aiLogin}</div>
          )}
        </section>
      ) : (
        <button className="floating-ai ai-bubble" style={aiWidgetStyle} type="button" onClick={() => setAiOpen(true)}>
          AI
        </button>
      )}

      <section className="orders-section">
        <div className="section-heading">
          <h2>{t.recentOrders}</h2>
        </div>
        <RecentOrders currency={currency} rates={rates} transactions={portfolio?.recentTransactions ?? []} t={t} />
      </section>

      {assetDialogOpen && selectedAsset && (
        <div className="modal-backdrop" onMouseDown={() => setAssetDialogOpen(false)}>
          <section className="asset-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <header className="modal-header">
              <div className="trade-title">
                <CoinIcon size="large" symbol={selectedAsset.symbol} />
                <div>
                  <span>{selectedAsset.pair}</span>
                  <h2>{selectedAsset.symbol} {t.chart}</h2>
                </div>
              </div>
              <button className="close-button" type="button" aria-label="Close" onClick={() => setAssetDialogOpen(false)}>×</button>
            </header>
            <div className="asset-modal-body">
              <div className="chart-card inline">
                <PriceChart currency={currency} history={priceHistory} rates={rates} />
              </div>
              <form className="trade-card inline" onSubmit={handleTradeSubmit}>
                <div className="asset-stats">
                  <div><span>{t.price}</span><strong>{formatMoney(selectedAsset.price, currency, rates)}</strong></div>
                  <div><span>{t.change}</span><strong className={Number(selectedAsset.changePercent) >= 0 ? 'up-text' : 'down-text'}>{formatPercent(selectedAsset.changePercent)}</strong></div>
                </div>
                <div className="segmented-control">
                  <button className={tradeType === 'BUY' ? 'active buy' : ''} type="button" onClick={() => setTradeType('BUY')}>{t.buy}</button>
                  <button className={tradeType === 'SELL' ? 'active sell' : ''} disabled={!canSellSelected} type="button" onClick={() => setTradeType('SELL')}>{t.sell}</button>
                </div>
                <label>{t.quantity}<input min="0.0000000001" step="0.0000000001" required type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
                <label>{t.currency}
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                    {currencyOptions.map((option) => <option key={option} value={option}>{currencyMeta[option].label}</option>)}
                  </select>
                </label>
                <div className="estimate-card">
                  <span>{t.estimate}</span>
                  <strong>{formatMoney(estimateUsd, currency, rates)}</strong>
                </div>
                {!session && <div className="empty-state">{t.loginToTrade}</div>}
                <button className="primary-button" disabled={loading.trade || !session} type="submit">{loading.trade ? t.loading : t.execute}</button>
              </form>
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSettingsOpen(false)}>
          <section className="settings-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <header className="modal-header">
              <div>
                <span>{t.account}</span>
                <h2>{t.settings}</h2>
              </div>
              <button className="close-button" type="button" aria-label="Close" onClick={() => setSettingsOpen(false)}>×</button>
            </header>
            <div className="settings-grid">
              <label>{t.language}<select value={language} onChange={(event) => setLanguage(event.target.value)}>{languageOptions.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}</select></label>
              <label>{t.currency}<select value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencyOptions.map((option) => <option key={option} value={option}>{currencyMeta[option].label}</option>)}</select></label>
              <label>{t.theme}<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="light">{t.light}</option><option value="dark">{t.dark}</option></select></label>
            </div>
            {session && (
              <>
                <form className="settings-form" onSubmit={handleProfileSubmit}>
                  <h3>{t.updateProfile}</h3>
                  <label>{t.email}<input readOnly value={account?.email ?? session.email} /></label>
                  <label>{t.displayName}<input value={accountForm.displayName} onChange={(event) => setAccountForm((current) => ({ ...current, displayName: event.target.value }))} maxLength={120} /></label>
                  <label>{t.phone}<input value={accountForm.phoneNumber} onChange={(event) => setAccountForm((current) => ({ ...current, phoneNumber: event.target.value }))} maxLength={32} placeholder="+90 5xx xxx xx xx" /></label>
                  <button className="primary-button" disabled={loading.settings} type="submit">{t.updateProfile}</button>
                </form>
                <form className="settings-form" onSubmit={handlePasswordSubmit}>
                  <h3>{t.security}</h3>
                  <label>{t.currentPassword}<input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} required minLength={6} /></label>
                  <label>{t.newPassword}<input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} required minLength={8} /></label>
                  <label>{t.confirmPassword}<input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} required minLength={8} /></label>
                  <button className="secondary-button" disabled={loading.settings} type="submit">{t.changePassword}</button>
                </form>
                <form className="danger-zone" onSubmit={handleDeleteAccount}>
                  <h3>{t.deleteAccount}</h3>
                  <p>{t.confirmDelete}</p>
                  <label>{t.email}<input type="email" value={deleteForm.emailConfirmation} onChange={(event) => setDeleteForm((current) => ({ ...current, emailConfirmation: event.target.value }))} required /></label>
                  <label>{t.password}<input type="password" value={deleteForm.password} onChange={(event) => setDeleteForm((current) => ({ ...current, password: event.target.value }))} required /></label>
                  <button className="danger-button" disabled={loading.settings} type="submit">{t.deleteAccount}</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function PriceChart({ currency, history, rates }) {
  const chartData = history.map((point) => ({
    price: Number(point.price),
    time: new Date(point.capturedAt).toLocaleTimeString(currencyMeta[currency].locale, { hour: '2-digit', minute: '2-digit' }),
  }))

  if (chartData.length === 0) {
    return <div className="empty-state">Grafik için piyasa snapshotı bekleniyor.</div>
  }

  return (
    <div className="price-chart">
      <ResponsiveContainer height={300} width="100%">
        <LineChart data={chartData} margin={{ bottom: 4, left: 4, right: 18, top: 8 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" />
          <XAxis dataKey="time" minTickGap={24} stroke="var(--muted)" tick={{ fontSize: 12 }} />
          <YAxis
            domain={['auto', 'auto']}
            stroke="var(--muted)"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatMoney(value, currency, rates).replace(/\s/g, '')}
            width={88}
          />
          <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} formatter={(value) => [formatMoney(value, currency, rates), '']} />
          <Line dataKey="price" dot={false} isAnimationActive={false} stroke="var(--accent)" strokeWidth={3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function RecentOrders({ currency, rates, t, transactions }) {
  if (transactions.length === 0) {
    return <div className="empty-state">{t.noOrders}</div>
  }

  return (
    <div className="orders-table">
      <div className="orders-row orders-head">
        <span>Type</span>
        <span>{t.coin}</span>
        <span>{t.quantity}</span>
        <span>{t.estimate}</span>
      </div>
      {transactions.map((transaction) => (
        <div className="orders-row" key={transaction.id}>
          <strong className={transaction.type === 'BUY' ? 'buy-text' : 'sell-text'}>{transaction.type}</strong>
          <span>{transaction.symbol}</span>
          <span>{formatCrypto(transaction.quantity)}</span>
          <strong>{formatMoney(transaction.totalAmount, currency, rates)}</strong>
        </div>
      ))}
    </div>
  )
}

export default App
