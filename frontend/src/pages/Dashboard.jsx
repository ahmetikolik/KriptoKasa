import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({ portfolio, prices = [], setActiveView }) {
  const { t } = useLanguage();
  if (!portfolio) {
    return (
      <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full flex items-center justify-center">
        <div className="glass-panel p-xl rounded-xl text-center">
          <p className="text-on-surface-variant font-body-base">Lütfen cüzdan bilgilerinizi görmek için giriş yapın.</p>
          <button onClick={() => window.location.reload()} className="mt-md bg-primary-container text-on-primary-container px-lg py-sm rounded-DEFAULT font-label-caps uppercase hover:glow-bloom">Giriş Yap</button>
        </div>
      </main>
    );
  }

  const holdings = portfolio.holdings || [];
  const transactions = portfolio.recentTransactions || portfolio.transactions || [];
  const usdtBalance = portfolio.fiatBalance !== undefined 
    ? portfolio.fiatBalance 
    : (holdings.find(h => h.symbol === 'USDT')?.quantity || 0);

  const cryptoHoldings = holdings.filter(h => h.symbol !== 'USDT');

  // Helper to calculate PnL per holding
  const getAssetPnL = (symbol, quantity) => {
    const currentPrice = prices.find(p => p.symbol === symbol)?.price;
    if (!currentPrice) return null;
    
    // Find all BUY transactions for this symbol to estimate cost basis
    const buys = transactions.filter(t => t.symbol === symbol && t.type === 'BUY');
    if (buys.length === 0) return null; // No buy history in recent transactions

    const totalCost = buys.reduce((sum, t) => sum + (t.executionPrice * t.quantity), 0);
    const totalBuyQuantity = buys.reduce((sum, t) => sum + t.quantity, 0);
    const avgBuyPrice = totalCost / totalBuyQuantity;

    const currentValue = quantity * currentPrice;
    const costBasis = quantity * avgBuyPrice;
    const profit = currentValue - costBasis;
    const profitPercent = (profit / costBasis) * 100;

    return { profit, profitPercent, currentValue };
  };

  return (
    <main className="flex-grow pt-32 pb-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto w-full flex flex-col gap-xl">
      <div className="flex justify-between items-center">
        <h1 className="font-display-lg text-display-lg text-on-surface">{t('portfolio.title')}</h1>
        <button onClick={() => setActiveView('trade')} className="border border-white/20 text-on-surface font-label-caps px-lg py-sm rounded-DEFAULT hover:border-primary-container hover:text-primary-container transition-all glass-panel">
          {t('nav.trade')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Left Column: Balances */}
        <div className="col-span-1 glass-panel rounded-xl p-lg flex flex-col gap-lg h-fit">
          <div>
            <h2 className="font-headline-md text-on-surface-variant mb-sm uppercase tracking-wider">{t('portfolio.fiatBalance')}</h2>
            <div className="font-display-lg text-4xl text-primary-container glow-sm">
              ${Number(usdtBalance).toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-md">
            <h3 className="font-headline-md text-on-surface mb-md">{t('portfolio.holdings')}</h3>
            <div className="flex flex-col gap-sm">
              {cryptoHoldings.map(h => {
                const pnl = getAssetPnL(h.symbol, h.quantity);
                return (
                  <div key={h.symbol} className="flex justify-between items-center p-sm rounded-lg bg-surface-container-low border border-white/5">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container">
                        <span className="font-tech-mono text-xs">{h.symbol[0]}</span>
                      </div>
                      <span className="font-body-bold text-on-surface">{h.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-tech-mono text-secondary">{Number(h.quantity).toLocaleString()}</div>
                      {pnl && (
                        <div className={`text-xs font-bold mt-1 ${pnl.profit >= 0 ? 'text-buy' : 'text-sell'}`}>
                          {pnl.profit >= 0 ? '+' : ''}{pnl.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} 
                          {' '}({pnl.profit >= 0 ? '+' : ''}{pnl.profitPercent.toFixed(2)}%)
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {cryptoHoldings.length === 0 && (
                <div className="text-on-surface-variant text-sm py-sm">Henüz kripto varlığınız bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History */}
        <div className="col-span-1 lg:col-span-2 glass-panel rounded-xl p-lg flex flex-col h-[500px]">
          <h2 className="font-headline-md text-on-surface mb-md">{t('portfolio.recentTransactions')}</h2>
          
          <div className="flex-grow overflow-auto">
            <div className="grid grid-cols-4 font-label-caps text-on-surface-variant border-b border-white/10 pb-sm mb-sm text-sm">
              <div>{t('portfolio.txDate')}</div>
              <div>{t('portfolio.txType')}</div>
              <div>{t('portfolio.asset')}</div>
              <div className="text-right">{t('portfolio.txAmount')}</div>
            </div>
            
            <div className="flex flex-col gap-xs">
              {transactions.length > 0 ? transactions.map((t) => (
                <div key={t.id} className="grid grid-cols-4 py-sm items-center border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                  <div className="text-on-surface-variant">{new Date(t.createdAt).toLocaleDateString('tr-TR')}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'BUY' ? 'bg-secondary-container/20 text-buy' : 'bg-error/20 text-sell'}`}>
                      {t.type}
                    </span>
                  </div>
                  <div className="font-body-bold text-on-surface">{t.symbol}</div>
                  <div className="text-right font-tech-mono text-secondary">{Number(t.quantity).toLocaleString()}</div>
                </div>
              )) : (
                <div className="py-xl text-center text-on-surface-variant">İşlem geçmişi bulunamadı.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
