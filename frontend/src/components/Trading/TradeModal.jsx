import { X, Loader2 } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import CoinIcon from '../Market/CoinIcon'
import { currencyMeta, formatMoney, formatPercent, formatCrypto } from '../../data/constants'

export default function TradeModal({
  t,
  selectedAsset,
  priceHistory,
  currency,
  rates,
  tradeType,
  setTradeType,
  quantity,
  setQuantity,
  estimateUsd,
  canSellSelected,
  session,
  loading,
  onSubmit,
  onClose,
}) {
  if (!selectedAsset) return null

  const change = Number(selectedAsset.changePercent ?? 0)
  const isUp = change >= 0

  const chartData = priceHistory.map((point) => ({
    price: Number(point.price),
    time: new Date(point.capturedAt).toLocaleTimeString(currencyMeta[currency].locale, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onMouseDown={onClose}
    >
      <section
        className="glass rounded-2xl shadow-2xl border border-white/[0.08] w-full max-w-[1060px] max-h-[calc(100vh-40px)] overflow-auto"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <CoinIcon size="large" symbol={selectedAsset.symbol} />
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                {selectedAsset.pair}
              </p>
              <h2 className="text-lg font-black text-white">
                {selectedAsset.symbol} {t.chart}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 p-5">
          {/* Chart */}
          <div className="min-w-0">
            {chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center rounded-xl bg-white/[0.02] border border-dashed border-white/[0.06] text-slate-500 text-sm">
                Grafik için piyasa snapshotı bekleniyor...
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer height={300} width="100%">
                  <LineChart data={chartData} margin={{ bottom: 4, left: 4, right: 18, top: 8 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.06)" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="time"
                      minTickGap={24}
                      stroke="#475569"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#475569"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) =>
                        formatMoney(value, currency, rates).replace(/\s/g, '')
                      }
                      width={88}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: '12px',
                        color: '#f1f5f9',
                        backdropFilter: 'blur(12px)',
                      }}
                      formatter={(value) => [formatMoney(value, currency, rates), '']}
                    />
                    <Line
                      dataKey="price"
                      dot={false}
                      isAnimationActive={false}
                      stroke={isUp ? '#00ff88' : '#ff3366'}
                      strokeWidth={2.5}
                      type="monotone"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trade Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.04] rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.price}
                </span>
                <p className="text-lg font-black text-white">
                  {formatMoney(selectedAsset.price, currency, rates)}
                </p>
              </div>
              <div className="bg-white/[0.04] rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t.change}
                </span>
                <p className={`text-lg font-black ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(selectedAsset.changePercent)}
                </p>
              </div>
            </div>

            {/* Buy/Sell Toggle */}
            <div className="flex rounded-xl bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.buy}
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                disabled={!canSellSelected}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  tradeType === 'SELL'
                    ? 'bg-red-500/20 text-red-400 shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.sell}
              </button>
            </div>

            {/* Quantity */}
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.quantity}
              </span>
              <input
                type="number"
                min="0.0000000001"
                step="0.0000000001"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-all"
                placeholder="0.00"
              />
            </label>

            {/* Estimate */}
            <div className="bg-white/[0.04] rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t.estimate}
              </span>
              <p className="text-2xl font-black text-white">
                {formatMoney(estimateUsd, currency, rates)}
              </p>
              <p className="text-[11px] text-slate-500">{t.delayedNote}</p>
            </div>

            {/* Login Warning */}
            {!session && (
              <div className="text-center text-sm text-slate-500 bg-white/[0.02] rounded-xl p-3 border border-dashed border-white/[0.06]">
                {t.loginToTrade}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !session}
              className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
                tradeType === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/20 hover:shadow-red-500/40'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.execute
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
