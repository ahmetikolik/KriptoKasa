import { Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function AuthPanel({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  onSubmit,
  loading,
  session,
  account,
  summary,
  currency,
  rates,
  formatMoney,
  onSettingsOpen,
  onSignOut,
}) {
  const { t } = useLanguage();
  if (session) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-black">
            {(account?.displayName || session.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {account?.displayName || session.email}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {account?.phoneNumber || session.email}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.04] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('auth.wallet')}
          </span>
          <p className="text-2xl font-black text-white">
            {formatMoney(summary.totalValue, currency, rates)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSettingsOpen}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            {t('auth.settings')}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
          >
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8">
      {/* Tabs */}
      <div className="flex rounded-xl bg-white/[0.04] p-1 mb-5">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            authMode === 'login'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-4 h-4" />
          {t('auth.login')}
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            authMode === 'register'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {t('auth.create')}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('auth.email')}
          </span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              value={authForm.email}
              onChange={(e) => setAuthForm((c) => ({ ...c, email: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              placeholder="hello@example.com"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('auth.password')}
          </span>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              value={authForm.password}
              onChange={(e) => setAuthForm((c) => ({ ...c, password: e.target.value }))}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              placeholder="••••••••"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('auth.loading')}
            </>
          ) : authMode === 'login' ? (
            t('auth.login')
          ) : (
            t('auth.create')
          )}
        </button>
      </form>
    </div>
  )
}
