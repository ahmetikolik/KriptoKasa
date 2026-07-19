export default function MarketTicker({ prices }) {
  // Use prices or fallback data
  const displayPrices = prices && prices.length > 0 ? prices : [
    { symbol: 'BTC', price: '64230.50', change24h: 2.4 },
    { symbol: 'ETH', price: '3450.20', change24h: 1.8 },
    { symbol: 'SOL', price: '145.60', change24h: -0.5 },
    { symbol: 'ADA', price: '0.45', change24h: 5.2 },
    { symbol: 'DOT', price: '7.20', change24h: -1.2 },
  ];

  return (
    <section className="mb-24 border-y border-white/5 py-3">
      <div className="ticker-wrap">
        <div className="ticker font-tech-mono text-tech-mono flex gap-xl text-on-surface-variant">
          {displayPrices.map((asset, i) => (
            <span key={i} className="flex gap-2 items-center">
              <span>{asset.symbol}</span>
              <span className="text-primary-container">${Number(asset.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              <span className={asset.change24h >= 0 ? 'text-secondary-fixed' : 'text-[#FF5C00]'}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
              </span>
              <span className="mx-4 text-white/20">•</span>
            </span>
          ))}
          {/* Duplicate for infinite effect */}
          {displayPrices.map((asset, i) => (
            <span key={`dup-${i}`} className="flex gap-2 items-center">
              <span>{asset.symbol}</span>
              <span className="text-primary-container">${Number(asset.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              <span className={asset.change24h >= 0 ? 'text-secondary-fixed' : 'text-[#FF5C00]'}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
              </span>
              <span className="mx-4 text-white/20">•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
