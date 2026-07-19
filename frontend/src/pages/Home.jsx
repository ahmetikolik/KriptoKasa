import React from 'react';
import MarketTicker from '../components/Shared/MarketTicker';
import { useLanguage } from '../context/LanguageContext';

export default function Home({ prices, setActiveView, onSelectAsset }) {
  const { t } = useLanguage();

  // Fallbacks if no prices yet
  const fallbackPrices = [
    { symbol: 'BTC', name: 'Bitcoin', price: 64230.50, changePercent: 2.45, icon: 'currency_bitcoin', color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', price: 3450.20, changePercent: 1.82, icon: 'diamond', color: '#627EEA' },
    { symbol: 'SOL', name: 'Solana', price: 145.60, changePercent: -0.54, icon: 'bolt', color: '#14F195' },
    { symbol: 'ADA', name: 'Cardano', price: 0.45, changePercent: 5.2, icon: 'cardano', color: '#0033AD' },
    { symbol: 'DOT', name: 'Polkadot', price: 7.20, changePercent: -1.2, icon: 'polkadot', color: '#E6007A' }
  ];
  
  const safePrices = prices && prices.length > 0 ? prices : fallbackPrices;
  
  const getChange = (c) => c.change24h ?? c.changePercent ?? 0;
  
  const topGainers = [...safePrices].sort((a, b) => getChange(b) - getChange(a)).slice(0, 3);
  const topLosers = [...safePrices].sort((a, b) => getChange(a) - getChange(b)).slice(0, 3);
  const popularSymbols = ['BTC', 'ETH', 'SOL'];
  const popular = popularSymbols.map(sym => safePrices.find(p => p.symbol === sym)).filter(Boolean);

  const topPrices = safePrices.slice(0, 3);

  const handleAssetClick = (asset) => {
    onSelectAsset(asset.symbol);
    setActiveView('trade');
  };

  return (
    <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full">
      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-xl items-center mb-32">
        <div className="space-y-lg">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
            {t('home.hero.title')} <br /><span className="text-primary-container">{t('home.hero.titleHighlight')}</span>
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant max-w-[450px]">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex gap-md pt-md flex-wrap">
            <button onClick={() => setActiveView('trade')} className="bg-primary-container text-on-primary-container font-label-caps text-label-caps px-xl py-md rounded-DEFAULT uppercase tracking-widest hover:glow-bloom transition-all shadow-[0px_0px_20px_rgba(0,209,255,0.5)] text-center">
              {t('home.hero.start')}
            </button>
            <button onClick={() => document.getElementById('markets').scrollIntoView({ behavior: 'smooth' })} className="border border-white/20 text-on-surface font-label-caps text-label-caps px-xl py-md rounded-DEFAULT uppercase tracking-widest hover:border-primary-container hover:text-primary-container hover:glow-sm transition-all glass-panel">
              {t('home.hero.markets')}
            </button>
          </div>
        </div>
        <div className="relative h-[400px] md:h-[600px] flex items-center justify-center">
          <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-[100px] -z-10"></div>
          <img className="object-contain max-h-full drop-shadow-[0_0_50px_rgba(0,209,255,0.3)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyAY6YLFIAmJuheNHgXPA7wLf33FIoeArAtbgK0vg-OwSyYp1x8PLOLQ2UmN51kcGIf8X7nSx7KCY3qDpsKvJsKfgPSGERvRSYfpyhK1Sph-9bsqPWHOu3V1Rz5wY2U_NY4wxy16UaWyRnpE54-XCxJYw_b5S8U9t0q6W0Nj5RgD66BKTDVDv2_Xo4yiCy89f-iSGmjijjws644a-SzNE84MmvxIfwPwcr7CqMH8T4bK4YNWMNQzvloQ" alt="Abstract Crypto Crystal" />
        </div>
      </section>

      {/* Market Ticker */}
      <MarketTicker prices={prices} />

      {/* Trending Section */}
      <section className="mb-32">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-lg">{t('home.trending.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Top Gainers */}
          <div className="glass-panel p-md rounded-xl">
            <h3 className="text-secondary-fixed font-label-caps mb-md flex items-center gap-2"><span className="material-symbols-outlined text-sm">trending_up</span> {t('home.trending.gainers')}</h3>
            <div className="flex flex-col gap-sm">
              {topGainers.map(coin => (
                <div key={coin.symbol} className="flex justify-between items-center p-sm bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { onSelectAsset(coin.symbol); setActiveView('trade'); }}>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container text-xs font-bold">{coin.symbol[0]}</div>
                     <span className="font-body-bold">{coin.symbol}</span>
                   </div>
                   <div className="text-right">
                     <div className="text-sm">${Number(coin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                     <div className="text-xs text-secondary-fixed">+{getChange(coin).toFixed(2)}%</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Top Losers */}
          <div className="glass-panel p-md rounded-xl">
             <h3 className="text-error font-label-caps mb-md flex items-center gap-2"><span className="material-symbols-outlined text-sm">trending_down</span> {t('home.trending.losers')}</h3>
             <div className="flex flex-col gap-sm">
              {topLosers.map(coin => (
                <div key={coin.symbol} className="flex justify-between items-center p-sm bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { onSelectAsset(coin.symbol); setActiveView('trade'); }}>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center text-error text-xs font-bold">{coin.symbol[0]}</div>
                     <span className="font-body-bold">{coin.symbol}</span>
                   </div>
                   <div className="text-right">
                     <div className="text-sm">${Number(coin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                     <div className="text-xs text-error">{getChange(coin).toFixed(2)}%</div>
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular */}
          <div className="glass-panel p-md rounded-xl">
             <h3 className="text-primary-container font-label-caps mb-md flex items-center gap-2"><span className="material-symbols-outlined text-sm">local_fire_department</span> {t('home.trending.popular')}</h3>
             <div className="flex flex-col gap-sm">
              {popular.map(coin => (
                <div key={coin.symbol} className="flex justify-between items-center p-sm bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { onSelectAsset(coin.symbol); setActiveView('trade'); }}>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container text-xs font-bold">{coin.symbol[0]}</div>
                     <span className="font-body-bold">{coin.symbol}</span>
                   </div>
                   <div className="text-right">
                     <div className="text-sm">${Number(coin.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                     <div className={`text-xs ${getChange(coin) >= 0 ? 'text-secondary-fixed' : 'text-error'}`}>{getChange(coin) > 0 ? '+' : ''}{getChange(coin).toFixed(2)}%</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Main Market Flow (Moved to bottom) */}
      <section id="markets" className="mb-12">
        <div className="flex justify-between items-end mb-lg">
          <h2 className="font-headline-md text-headline-md text-on-surface">{t('home.markets.title')}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-md max-h-[800px] overflow-y-auto custom-scrollbar p-1">
          {(prices?.length > 0 ? prices : topPrices).map((asset, idx) => (
            <div 
              key={asset.symbol} 
              onClick={() => handleAssetClick(asset)} 
              className="glass-panel p-md rounded-xl cursor-pointer border border-white/5 hover:border-primary-container hover:shadow-[0_0_15px_rgba(0,209,255,0.2)] hover:bg-white/5 transition-all flex flex-col justify-between aspect-square"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md text-on-surface">{asset.symbol}</span>
                  <span className="text-on-surface-variant text-sm truncate max-w-[100px]">{asset.name || asset.symbol}</span>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-on-surface-variant">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{asset.icon || 'currency_bitcoin'}</span>
                </div>
              </div>
              
              <div className="flex-grow flex items-center justify-center w-full px-1">
                <svg fill="none" height="40" viewBox="0 0 100 40" width="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <path d={asset.changePercent >= 0 ? "M0 35 C 15 30, 25 35, 40 20 C 55 5, 70 25, 85 10 C 95 0, 98 10, 100 5" : "M0 5 C 15 10, 25 5, 40 20 C 55 35, 70 15, 85 30 C 95 40, 98 30, 100 35"} fill="none" stroke={asset.changePercent >= 0 ? "#A2FF00" : "#FF5C00"} strokeLinecap="round" strokeWidth="2"></path>
                  <path d={asset.changePercent >= 0 ? "M0 35 C 15 30, 25 35, 40 20 C 55 5, 70 25, 85 10 C 95 0, 98 10, 100 5 L100 40 L0 40 Z" : "M0 5 C 15 10, 25 5, 40 20 C 55 35, 70 15, 85 30 C 95 40, 98 30, 100 35 L100 40 L0 40 Z"} fill={asset.changePercent >= 0 ? "url(#gradUp)" : "url(#gradDown)"} stroke="none" opacity="0.3"></path>
                  <defs>
                    <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A2FF00" stopOpacity="1" />
                      <stop offset="100%" stopColor="#A2FF00" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF5C00" stopOpacity="1" />
                      <stop offset="100%" stopColor="#FF5C00" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="mt-auto">
                <div className="text-on-surface font-tech-mono text-lg mb-1">
                  ${Number(asset.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 4})}
                </div>
                <div className={`font-tech-mono text-md ${asset.changePercent >= 0 ? 'text-secondary-fixed drop-shadow-[0_0_8px_rgba(162,255,0,0.5)]' : 'text-[#FF5C00] drop-shadow-[0_0_8px_rgba(255,92,0,0.5)]'}`}>
                  {asset.changePercent >= 0 ? '+' : ''}{Number(asset.changePercent).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
