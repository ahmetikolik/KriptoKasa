import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { useLanguage } from '../context/LanguageContext';

export default function TradeTerminal({ prices, portfolio, priceHistory, selectedSymbol, onSelectAsset, onTradeSubmit, loading }) {
  const { t } = useLanguage();
  const [tradeType, setTradeType] = useState('Market');
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [timeframe, setTimeframe] = useState('1H');
  const [showMA, setShowMA] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [maPeriod, setMaPeriod] = useState(20);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chartContainerRef = useRef(null);
  const chartWrapperRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const maSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  
  const asset = prices?.find(p => p.symbol === selectedSymbol) || prices?.[0];
  const btcPrice = asset?.price || 0;
  
  const isUp = Number(asset?.changePercent ?? 0) >= 0;
  const primaryColor = isUp ? '#A2FF00' : '#FF5C00';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Create chart instance
      const chart = createChart(chartContainerRef.current, {
        autoSize: true,
        layout: {
          background: { type: 'solid', color: 'transparent' },
          textColor: '#bbc9cf',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
            style: 1,
          },
          horzLine: {
            color: 'rgba(255, 255, 255, 0.4)',
            width: 1,
            style: 1,
          },
        },
      });

      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // Set as an overlay
        visible: false,
      });

      chart.priceScale('').applyOptions({
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
      });

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#A2FF00',
        downColor: '#FF5C00',
        borderVisible: false,
        wickUpColor: '#A2FF00',
        wickDownColor: '#FF5C00',
      });

      const maSeries = chart.addSeries(LineSeries, {
        color: '#00d1ff',
        lineWidth: 2,
        visible: false,
      });

      chartRef.current = chart;
      seriesRef.current = series;
      volumeSeriesRef.current = volumeSeries;
      maSeriesRef.current = maSeries;

      const handleResize = () => {
        if (chartContainerRef.current && chartContainerRef.current.clientWidth > 0) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      
      // Initial resize to ensure it fits the container on mount
      handleResize();
      
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (err) {
      console.error('Chart Initialization Error:', err);
    }
  }, [primaryColor]);

  useEffect(() => {
    if (maSeriesRef.current) {
      maSeriesRef.current.applyOptions({ visible: showMA });
    }
  }, [showMA]);

  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: showVolume });
    }
  }, [showVolume]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !priceHistory || priceHistory.length === 0) return;
    
    try {
      // Gerçekçi bir mum grafiği görüntüsü için geriye dönük 60 dakikalık sentetik OHLC verisi üretiyoruz
      // Çünkü veritabanındaki saniyelik snaphot'lar doji (çizgi) şeklinde çirkin görünüyor
      const currentPrice = Number(btcPrice) || 100;
      const uniqueData = [];
      let intervalSeconds = 60; // 1H default (1 per minute for 60 candles)
      if (timeframe === '15m') intervalSeconds = 15; // 15s candles
      if (timeframe === '4H') intervalSeconds = 240; // 4m candles
      if (timeframe === '1D') intervalSeconds = 1440; // 24m candles
      
      const volatilityMap = { '15m': 0.0005, '1H': 0.002, '4H': 0.005, '1D': 0.015 };
      const baseVolatility = volatilityMap[timeframe] || 0.002;
      
      const now = Math.floor(Date.now() / 1000);
      const candles = [];
      let currentClose = currentPrice;
      
      // Geriye doğru mumları üretelim ki son mum ile fiyat arasında uçurum olmasın
      for (let i = 0; i <= 60; i++) {
        const time = now - (i * intervalSeconds) - (now % intervalSeconds);
        
        const close = currentClose;
        const volatility = close * baseVolatility;
        const open = close + (Math.random() - 0.505) * volatility; // %50 ihtimalle yön
        
        const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
        const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
        
        candles.push({ time, open, high, low, close });
        
        // Bir önceki mumun kapanışı, bu mumun açılışıdır
        currentClose = open;
      }
      
      // Çizim için verileri eskiden yeniye (chronological) sıralamalıyız
      uniqueData.push(...candles.reverse());

      if (uniqueData.length > 0) {
        seriesRef.current.setData(uniqueData);
        
        // Calculate Volume Data
        const volumeData = uniqueData.map(d => ({
          time: d.time,
          value: Math.max(0, (Math.random() * 100) + 50), // Mock volume
          color: d.close >= d.open ? 'rgba(162, 255, 0, 0.4)' : 'rgba(255, 92, 0, 0.4)',
        }));
        volumeSeriesRef.current.setData(volumeData);

        // Calculate MA Data
        const maData = [];
        for (let i = 0; i < uniqueData.length; i++) {
          if (i < maPeriod - 1) continue; // Not enough data for MA
          let sum = 0;
          for (let j = 0; j < maPeriod; j++) {
            sum += uniqueData[i - j].close;
          }
          maData.push({
            time: uniqueData[i].time,
            value: sum / maPeriod,
          });
        }
        maSeriesRef.current.setData(maData);

        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Chart Data Error:', err);
    }
  }, [btcPrice, timeframe, maPeriod]);

  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [marketTrades, setMarketTrades] = useState([]);

  useEffect(() => {
    if (!btcPrice) return;
    
    const generateOrderBook = () => {
      const bids = Array.from({length: 8}).map((_, i) => ({
        price: btcPrice * (1 - (i+1)*0.0005),
        amount: Math.random() * 2 + 0.01
      }));
      const asks = Array.from({length: 8}).map((_, i) => ({
        price: btcPrice * (1 + (8-i)*0.0005),
        amount: Math.random() * 2 + 0.01
      }));
      return { bids, asks };
    };

    const generateTrades = () => {
      return Array.from({length: 12}).map(() => ({
        price: btcPrice * (1 + (Math.random() - 0.5) * 0.001),
        amount: Math.random() * 1.5 + 0.01,
        isUp: Math.random() > 0.5,
        time: new Date(Date.now() - Math.random() * 60000)
      })).sort((a,b) => b.time - a.time);
    };

    setOrderBook(generateOrderBook());
    setMarketTrades(generateTrades());

    const intId = setInterval(() => {
      setOrderBook(prev => {
        const newBids = [...prev.bids];
        const newAsks = [...prev.asks];
        if(Math.random() > 0.3) newBids[Math.floor(Math.random()*newBids.length)].amount = Math.random() * 2 + 0.01;
        if(Math.random() > 0.3) newAsks[Math.floor(Math.random()*newAsks.length)].amount = Math.random() * 2 + 0.01;
        return { bids: newBids, asks: newAsks };
      });
      
      if(Math.random() > 0.6) {
        setMarketTrades(prev => {
          const newTrade = {
            price: btcPrice * (1 + (Math.random() - 0.5) * 0.001),
            amount: Math.random() * 1.5 + 0.01,
            isUp: Math.random() > 0.5,
            time: new Date()
          };
          return [newTrade, ...prev].slice(0, 12);
        });
      }
    }, 800);

    return () => clearInterval(intId);
  }, [btcPrice]);

  const holdings = portfolio?.holdings?.find(h => h.symbol === selectedSymbol);
  const usdtBalance = portfolio?.holdings?.find(h => h.symbol === 'USDT')?.quantity || 0;

  const handleBuy = () => {
    if(!quantity) return;
    if (tradeType === 'Market') {
      onTradeSubmit({ type: 'BUY', quantity, symbol: selectedSymbol });
    } else {
      const msg = tradeType === 'Limit' ? `[Simülasyon] ${limitPrice || btcPrice} USDT fiyattan ${quantity} ${selectedSymbol} ALIŞ (Limit) emri deftere eklendi!` : `[Simülasyon] Fiyat ${stopPrice || btcPrice} USDT olduğunda ${limitPrice || btcPrice} fiyattan ALIŞ (Stop-Limit) emri tetiklenecek!`;
      onTradeSubmit({ type: 'SIMULATE', quantity, symbol: msg });
    }
    setQuantity('');
    setLimitPrice('');
    setStopPrice('');
  };

  const handleSell = () => {
    if(!quantity) return;
    if (tradeType === 'Market') {
      onTradeSubmit({ type: 'SELL', quantity, symbol: selectedSymbol });
    } else {
      const msg = tradeType === 'Limit' ? `[Simülasyon] ${limitPrice || btcPrice} USDT fiyattan ${quantity} ${selectedSymbol} SATIŞ (Limit) emri deftere eklendi!` : `[Simülasyon] Fiyat ${stopPrice || btcPrice} USDT olduğunda ${limitPrice || btcPrice} fiyattan SATIŞ (Stop-Limit) emri tetiklenecek!`;
      onTradeSubmit({ type: 'SIMULATE', quantity, symbol: msg });
    }
    setQuantity('');
    setLimitPrice('');
    setStopPrice('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (chartWrapperRef.current && chartWrapperRef.current.requestFullscreen) {
        chartWrapperRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <main className="flex-grow pt-[80px] px-sm md:px-margin-desktop pb-xl max-w-max-width mx-auto w-full grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-sm md:gap-md h-auto xl:h-[calc(100vh-80px)]">
      {/* Center/Left Column: Ticker, Chart, Order Book */}
      <div className="flex flex-col gap-sm md:gap-md h-full overflow-hidden">
        {/* Asset Ticker Panel */}
        <div className="glass-panel rounded-lg p-sm md:p-md flex flex-wrap items-center justify-between gap-md shrink-0">
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-xs cursor-pointer hover:text-primary-container transition-colors relative group">
              <span className="font-headline-md text-secondary">{asset?.symbol || 'BTC'}/USDT</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
              
              {/* Dropdown for asset switching */}
              <div className="absolute top-full left-0 mt-2 w-48 glass-panel rounded-lg shadow-xl hidden group-hover:flex flex-col z-50">
                {prices?.slice(0, 10).map(p => (
                  <button key={p.symbol} onClick={() => onSelectAsset(p.symbol)} className="px-4 py-2 text-left hover:bg-white/5 text-sm">
                    {p.symbol}/USDT
                  </button>
                ))}
              </div>
            </div>
            <div className="h-6 w-px bg-white/10 mx-sm hidden sm:block"></div>
            <div className="flex flex-col">
              <span className={`font-tech-mono text-lg ${isUp ? 'text-buy' : 'text-sell'}`}>{Number(btcPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              <span className="font-label-caps text-on-surface-variant uppercase">${Number(btcPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-xl text-sm">
            <div className="flex flex-col">
              <span className="font-label-caps text-on-surface-variant uppercase">24h Change</span>
              <span className={`font-tech-mono ${isUp ? 'text-buy' : 'text-sell'}`}>{isUp ? '+' : ''}{asset?.changePercent || 0}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-on-surface-variant uppercase">24h High</span>
              <span className="font-tech-mono text-secondary">{Number(btcPrice * 1.05).toLocaleString('en-US', {maximumFractionDigits:0})}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-on-surface-variant uppercase">24h Low</span>
              <span className="font-tech-mono text-secondary">{Number(btcPrice * 0.95).toLocaleString('en-US', {maximumFractionDigits:0})}</span>
            </div>
          </div>
        </div>

        {/* Advanced Chart Area */}
        <div ref={chartWrapperRef} className={`glass-panel rounded-lg p-md flex flex-col relative overflow-hidden ${isFullscreen ? 'w-full h-full' : 'flex-grow min-h-[300px]'}`}>
          <div className="flex justify-between items-center mb-md shrink-0 z-10">
            <div className="flex gap-sm items-center">
              {['15m', '1H', '4H', '1D'].map((tf) => (
                <button 
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`font-tech-mono text-xs px-2 py-1 rounded transition-colors ${timeframe === tf ? 'text-primary-container bg-surface-container-high border border-primary-container/30' : 'text-on-surface-variant hover:text-primary-container bg-surface-container-low'}`}
                >
                  {tf}
                </button>
              ))}
              <div className="w-px h-4 bg-outline-variant/30 mx-2 hidden sm:block"></div>
              {/* Indicator Toggles */}
              <div className="flex gap-1 items-center bg-surface-container-low rounded p-0.5 hidden sm:flex border border-transparent hover:border-outline-variant/30 transition-colors">
                <button 
                  onClick={() => setShowMA(!showMA)}
                  className={`font-tech-mono text-xs px-2 py-0.5 rounded transition-colors ${showMA ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface bg-transparent'}`}
                  title="Hareketli Ortalama (MA)"
                >
                  MA
                </button>
                {showMA && (
                  <select 
                    value={maPeriod} 
                    onChange={(e) => setMaPeriod(Number(e.target.value))}
                    className="bg-transparent text-xs font-tech-mono text-on-surface-variant outline-none cursor-pointer pr-1"
                  >
                    <option value={7}>7</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                )}
              </div>
              <button 
                onClick={() => setShowVolume(!showVolume)}
                className={`font-tech-mono text-xs px-2 py-1 rounded transition-colors hidden sm:block ${showVolume ? 'bg-primary-container/20 text-primary-container border border-primary-container/50' : 'text-on-surface-variant hover:text-on-surface bg-surface-container-low border border-transparent'}`}
                title="Hacim (Volume)"
              >
                VOL
              </button>
            </div>
            <button onClick={toggleFullscreen} className="text-on-surface-variant hover:text-primary-container transition-colors flex items-center justify-center p-1 rounded hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-lg">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
          
          <div className={`w-full flex-grow relative ${isFullscreen ? 'bg-[#0a0a0a]' : 'bg-[#0a0a0a] rounded'}`}>
             <div ref={chartContainerRef} className="absolute inset-0" />
          </div>
        </div>

        {/* Bottom Row: Markets, Order Book & Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm md:gap-md h-[300px] shrink-0">
          {/* Markets Panel */}
          <div className="glass-panel rounded-lg flex flex-col overflow-hidden">
            <div className="p-sm md:p-md border-b border-white/5 shrink-0 flex justify-between items-center">
              <span className="font-headline-md text-sm text-secondary">{t('trade.market')}</span>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">search</span>
            </div>
            <div className="flex-grow flex flex-col overflow-y-auto">
              {prices?.map(p => {
                const isPriceUp = Number(p.changePercent) >= 0;
                return (
                  <div 
                    key={p.symbol} 
                    onClick={() => onSelectAsset(p.symbol)}
                    className={`flex justify-between items-center p-sm cursor-pointer hover:bg-white/5 transition-colors border-l-2 ${selectedSymbol === p.symbol ? 'border-primary-container bg-white/5' : 'border-transparent'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-body-bold text-sm text-on-surface">{p.symbol}</span>
                      <span className="text-xs text-on-surface-variant">USDT</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-tech-mono text-sm ${isPriceUp ? 'text-buy' : 'text-sell'}`}>{Number(p.price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                      <span className={`text-xs ${isPriceUp ? 'text-buy' : 'text-sell'}`}>{isPriceUp ? '+' : ''}{p.changePercent}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-panel rounded-lg flex flex-col overflow-hidden">
            <div className="p-sm md:p-md border-b border-white/5 flex justify-between items-center shrink-0">
              <span className="font-headline-md text-sm text-secondary">{t('trade.orderBook.title')}</span>
            </div>
            <div className="flex-grow flex flex-col p-sm overflow-hidden font-tech-mono text-[10px] sm:text-[11px] leading-tight">
              <div className="flex justify-between text-on-surface-variant mb-2 px-1">
                <span>{t('trade.orderBook.price')}(USDT)</span>
                <span>{t('trade.orderBook.amount')}</span>
              </div>
              <div className="flex-1 flex flex-col justify-end gap-1 overflow-hidden">
                {orderBook.asks.map((ask, i) => (
                  <div key={`ask-${i}`} className="flex justify-between px-1 hover:bg-white/5 cursor-pointer relative">
                    <div className="absolute top-0 right-0 bottom-0 bg-sell/10" style={{width: `${Math.min(ask.amount*30, 100)}%`}}></div>
                    <span className="text-sell relative z-10">{Number(ask.price).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    <span className="text-on-surface relative z-10">{ask.amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className="py-2 text-center text-secondary font-bold border-y border-white/5 my-1">
                {Number(btcPrice).toLocaleString('en-US', {minimumFractionDigits:2})}
              </div>
              <div className="flex-1 flex flex-col justify-start gap-1 overflow-hidden">
                {orderBook.bids.map((bid, i) => (
                  <div key={`bid-${i}`} className="flex justify-between px-1 hover:bg-white/5 cursor-pointer relative">
                    <div className="absolute top-0 right-0 bottom-0 bg-buy/10" style={{width: `${Math.min(bid.amount*30, 100)}%`}}></div>
                    <span className="text-buy relative z-10">{Number(bid.price).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    <span className="text-on-surface relative z-10">{bid.amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-lg flex flex-col overflow-hidden">
            <div className="p-sm md:p-md border-b border-white/5 shrink-0">
              <span className="font-headline-md text-sm text-secondary">{t('trade.history.title')}</span>
            </div>
            <div className="flex-grow flex flex-col p-sm overflow-hidden font-tech-mono text-[10px] sm:text-[11px] leading-tight">
              <div className="flex justify-between text-on-surface-variant mb-2 px-1">
                <span>{t('trade.orderBook.price')}</span>
                <span>{t('trade.orderBook.amount')}</span>
                <span>{t('trade.history.time')}</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {marketTrades.map((trade, i) => (
                  <div key={`trade-${i}`} className="flex justify-between px-1 hover:bg-white/5 cursor-pointer">
                    <span className={trade.isUp ? 'text-buy' : 'text-sell'}>{Number(trade.price).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    <span className="text-on-surface">{trade.amount.toFixed(4)}</span>
                    <span className="text-on-surface-variant">{trade.time.toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Trading Terminal */}
      <aside className="glass-panel rounded-lg flex flex-col h-[500px] xl:h-full overflow-hidden shrink-0">
        <div className="flex border-b border-white/5 shrink-0">
          {['Limit', 'Market', 'Stop-Limit'].map((tab) => (
            <button key={tab} 
                    onClick={() => setTradeType(tab)}
                    className={`flex-1 py-sm font-headline-md text-sm transition-colors ${tradeType === tab ? 'text-primary-container border-b-2 border-primary-container bg-surface-container-low/50' : 'text-on-surface-variant hover:text-secondary'}`}>
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-md flex-grow flex flex-col gap-lg overflow-y-auto">
          <div className="flex justify-between items-center text-xs font-tech-mono">
            <span className="text-on-surface-variant">{t('trade.available')}</span>
            <span className="text-secondary font-bold">{Number(usdtBalance).toLocaleString()} USDT</span>
          </div>

          {tradeType === 'Stop-Limit' && (
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-on-surface-variant uppercase">{t('trade.stopPrice')}</label>
              <div className="relative flex items-center bg-surface-container-high rounded border border-outline-variant/30 border-glow transition-all">
                <input 
                  className="w-full bg-transparent border-none text-secondary font-tech-mono text-sm py-sm pl-sm pr-12 focus:ring-0 outline-none" 
                  type="number" 
                  placeholder={btcPrice} 
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                />
                <span className="absolute right-sm text-on-surface-variant font-tech-mono text-xs">USDT</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-on-surface-variant uppercase">{t('trade.price')}</label>
            <div className="relative flex items-center bg-surface-container-high rounded border border-outline-variant/30 border-glow transition-all">
              {tradeType === 'Market' ? (
                <input className="w-full bg-transparent border-none text-on-surface-variant font-tech-mono text-sm py-sm pl-sm pr-12 focus:ring-0 outline-none cursor-not-allowed" type="text" readOnly value="Market Price"/>
              ) : (
                <input 
                  className="w-full bg-transparent border-none text-secondary font-tech-mono text-sm py-sm pl-sm pr-12 focus:ring-0 outline-none" 
                  type="number" 
                  placeholder={btcPrice}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                />
              )}
              <span className="absolute right-sm text-on-surface-variant font-tech-mono text-xs">USDT</span>
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-on-surface-variant uppercase">{t('trade.quantity')}</label>
            <div className="relative flex items-center bg-surface-container-high rounded border border-outline-variant/30 border-glow transition-all">
              <input 
                className="w-full bg-transparent border-none text-secondary font-tech-mono text-sm py-sm pl-sm pr-12 focus:ring-0 outline-none" 
                placeholder="0.00" 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <span className="absolute right-sm text-on-surface-variant font-tech-mono text-xs">{asset?.symbol || 'BTC'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-xs mt-auto">
            <label className="font-label-caps text-on-surface-variant uppercase">{t('trade.total')}</label>
            <div className="relative flex items-center bg-surface-container-high rounded border border-outline-variant/30 cursor-not-allowed opacity-70">
              <input className="w-full bg-transparent border-none text-secondary font-tech-mono text-sm py-sm pl-sm pr-12 focus:ring-0 cursor-not-allowed outline-none" disabled value={(Number(quantity||0) * (tradeType === 'Market' ? Number(btcPrice) : Number(limitPrice || btcPrice))).toFixed(2)} type="text"/>
              <span className="absolute right-sm text-on-surface-variant font-tech-mono text-xs">USDT</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm mt-4">
            <button 
              onClick={handleBuy}
              disabled={loading || !quantity}
              className="btn-buy py-md rounded font-headline-md text-sm uppercase transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(162,255,0,0.4)] disabled:opacity-50">
              {loading ? '...' : `${t('trade.submitBuy')} ${asset?.symbol || 'BTC'}`}
            </button>
            <button 
              onClick={handleSell}
              disabled={loading || !quantity || !holdings || Number(holdings.quantity) < Number(quantity)}
              className="btn-sell py-md rounded font-headline-md text-sm uppercase transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(255,92,0,0.4)] disabled:opacity-50">
              {loading ? '...' : `${t('trade.submitSell')} ${asset?.symbol || 'BTC'}`}
            </button>
          </div>
        </div>
      </aside>
    </main>
  );
}
