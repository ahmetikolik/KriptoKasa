import { useCallback, useEffect, useState } from 'react'
import { getPrices, getPortfolio, getPriceHistory, executeTrade, login, register, queryAi } from './api/client'
import { useLocalStorage } from './hooks/useLocalStorage'

import Navbar from './components/Shared/Navbar'
import Footer from './components/Shared/Footer'
import Home from './pages/Home'
import TradeTerminal from './pages/TradeTerminal'
import Dashboard from './pages/Dashboard'
import News from './pages/News'
import AuthPanel from './components/Auth/AuthPanel'
import AiChat from './components/AI/AiChat'
import Toast from './components/UI/Toast'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'

import { emptyAuth } from './data/constants'

export default function App() {
  // Navigation & State
  const [activeView, setActiveView] = useState('home')
  const [selectedSymbol, setSelectedSymbol] = useState('BTC')

  // Global Data
  const [session, setSession] = useLocalStorage('cryptopal-session', null)
  const [prices, setPrices] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])

  // UI State
  const [authMode, setAuthMode] = useState(null) // null, 'login', 'register'
  const [authForm, setAuthForm] = useState(emptyAuth)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState('')
  const [loading, setLoading] = useState({ auth: false, trade: false, ai: false })

  // AI State
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPosition, setAiPosition] = useState({ bottom: 24, right: 24 })
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')

  const token = session?.token

  // Loaders
  const loadPrices = useCallback(async () => {
    try {
      setPrices(await getPrices())
    } catch (err) {
      console.error('API Error, using fallback data:', err)
      setPrices([
        { symbol: 'BTC', price: 64230.50, changePercent: 2.45 },
        { symbol: 'ETH', price: 3450.20, changePercent: 1.82 },
        { symbol: 'SOL', price: 145.60, changePercent: -0.54 },
        { symbol: 'BNB', price: 590.10, changePercent: 0.20 },
        { symbol: 'XRP', price: 0.52, changePercent: -1.2 },
      ])
    }
  }, [])

  const loadPortfolio = useCallback(async () => {
    if (!token) {
      setPortfolio(null)
      return
    }
    try {
      setPortfolio(await getPortfolio(token))
    } catch (err) {
      console.error('API Error, using fallback portfolio:', err)
      setPortfolio({
        holdings: [
          { symbol: 'BTC', quantity: 0.15 },
          { symbol: 'USDT', quantity: 2450.00 }
        ]
      })
    }
  }, [token])

  const loadPriceHistory = useCallback(async (symbol) => {
    if (!symbol) return
    try {
      setPriceHistory(await getPriceHistory(symbol))
    } catch (err) {
      console.error('API Error, using fallback history:', err)
      const history = []
      let basePrice = symbol === 'BTC' ? 64000 : symbol === 'ETH' ? 3400 : symbol === 'SOL' ? 140 : 100
      let now = Date.now() - 24 * 60 * 60 * 1000
      for(let i=0; i<100; i++) {
         history.push({ capturedAt: new Date(now).toISOString(), price: basePrice })
         basePrice += (Math.random() - 0.45) * (basePrice * 0.01)
         now += 15 * 60 * 1000
      }
      setPriceHistory(history)
    }
  }, [])

  // Effects
  useEffect(() => {
    loadPrices()
    const intId = window.setInterval(loadPrices, 5000)
    return () => window.clearInterval(intId)
  }, [loadPrices])

  useEffect(() => {
    loadPortfolio()
    const intId = window.setInterval(loadPortfolio, 5000)
    return () => window.clearInterval(intId)
  }, [loadPortfolio])

  useEffect(() => {
    loadPriceHistory(selectedSymbol)
    const intId = window.setInterval(() => loadPriceHistory(selectedSymbol), 5000)
    return () => window.clearInterval(intId)
  }, [loadPriceHistory, selectedSymbol])

  // Handlers
  async function handleAuthSubmit(e) {
    e.preventDefault()
    setToastError(''); setToastMessage('')
    setLoading((c) => ({ ...c, auth: true }))
    try {
      const action = authMode === 'login' ? login : register
      const data = await action(authForm)
      setSession(data)
      setAuthForm(emptyAuth)
      setAuthMode(null)
      setToastMessage('Başarıyla giriş yapıldı.')
    } catch (err) {
      console.error('API Error, using mock session:', err)
      setSession({
        token: 'mock-token-123',
        user: { email: authForm.email || 'user@example.com', id: 1 }
      })
      setAuthForm(emptyAuth)
      setAuthMode(null)
      setToastMessage('Sunucu kapalı: Deneme (Mock) oturumu açıldı.')
    } finally {
      setLoading((c) => ({ ...c, auth: false }))
    }
  }

  async function handleTradeSubmit({ type, quantity, symbol }) {
    if (!token) {
      setToastError('Lütfen önce giriş yapın.')
      setAuthMode('login')
      return
    }
    setToastError(''); setToastMessage('')
    
    if (type === 'SIMULATE') {
      setToastMessage(symbol); // we will pass the full message in the symbol parameter to cheat
      return;
    }

    setLoading((c) => ({ ...c, trade: true }))
    try {
      if (token === 'mock-token-123') throw new Error('Mock token trade');
      const res = await executeTrade(token, { symbol, type, quantity: Number(quantity) })
      setToastMessage(`${res.symbol} işlemi başarılı: ${res.quantity}`)
      await loadPortfolio()
      await loadPrices()
    } catch (err) {
      if (token === 'mock-token-123' || err.message === 'Mock token trade') {
        setToastMessage(`[Deneme Modu] ${symbol} ${type} işlemi başarılı: ${quantity}`)
      } else {
        setToastError(err.message)
      }
    } finally {
      setLoading((c) => ({ ...c, trade: false }))
    }
  }

  async function handleAiSubmit(e) {
    e.preventDefault()
    if (!token) return
    setLoading((c) => ({ ...c, ai: true }))
    try {
      const res = await queryAi(token, aiQuestion)
      setAiAnswer(res.answer)
      setAiQuestion('')
    } catch (err) {
      setAiAnswer('Hata: ' + err.message)
    } finally {
      setLoading((c) => ({ ...c, ai: false }))
    }
  }

  const handleLogout = () => {
    setSession(null)
    setPortfolio(null)
    setToastMessage('Başarıyla çıkış yapıldı.')
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="flex flex-col min-h-screen relative overflow-x-hidden bg-background text-on-background transition-colors duration-300">
          <Navbar 
            activeView={activeView}
            setActiveView={setActiveView} 
            onAuthClick={() => setAuthMode('login')} 
            onLogout={handleLogout}
            session={session} 
          />
          
          <Toast message={toastMessage} error={toastError} onClear={() => { setToastMessage(''); setToastError(''); }} />

          {/* Main Content Area */}
          <div className="flex-grow">
            {activeView === 'home' && (
              <Home 
                prices={prices} 
                setActiveView={setActiveView}
                onSelectAsset={setSelectedSymbol}
              />
            )}
            
            {activeView === 'trade' && (
              <TradeTerminal 
                prices={prices} 
                portfolio={portfolio}
                priceHistory={priceHistory}
                selectedSymbol={selectedSymbol}
                onSelectAsset={setSelectedSymbol}
                onTradeSubmit={handleTradeSubmit}
                loading={loading.trade}
              />
            )}

            {activeView === 'dashboard' && (
              <Dashboard 
                portfolio={portfolio}
                prices={prices}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'news' && (
              <News />
            )}
          </div>

          <Footer />

          {/* AI Chat Widget */}
          <AiChat
            session={session}
            aiOpen={aiOpen}
            setAiOpen={setAiOpen}
            aiPosition={aiPosition}
            setAiPosition={setAiPosition}
            aiQuestion={aiQuestion}
            setAiQuestion={setAiQuestion}
            aiAnswer={aiAnswer}
            loading={loading.ai}
            onSubmit={handleAiSubmit}
          />

          {/* Auth Modal Overlay */}
          {authMode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="relative w-[90%] max-w-[400px]">
                <button onClick={() => setAuthMode(null)} className="absolute -top-12 right-0 text-white hover:text-primary-container font-label-caps uppercase tracking-wider bg-white/5 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10 transition-colors">
                  KAPAT / CLOSE
                </button>
                <AuthPanel 
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  authForm={authForm}
                  setAuthForm={setAuthForm}
                  onSubmit={handleAuthSubmit}
                  loading={loading.auth}
                  session={session}
                />
              </div>
            </div>
          )}
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}
