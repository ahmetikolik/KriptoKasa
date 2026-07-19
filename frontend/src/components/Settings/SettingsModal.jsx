import { X, Loader2, Save, Trash2, KeyRound, Globe, Palette, Banknote } from 'lucide-react'
import { languageOptions, currencyOptions, currencyMeta } from '../../data/constants'

export default function SettingsModal({
  t,
  session,
  account,
  language,
  setLanguage,
  currency,
  setCurrency,
  theme,
  setTheme,
  accountForm,
  setAccountForm,
  passwordForm,
  setPasswordForm,
  deleteForm,
  setDeleteForm,
  loading,
  onProfileSubmit,
  onPasswordSubmit,
  onDeleteSubmit,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onMouseDown={onClose}
    >
      <section
        className="glass rounded-2xl shadow-2xl border border-white/[0.08] w-full max-w-2xl max-h-[calc(100vh-40px)] overflow-auto"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              {t.account}
            </p>
            <h2 className="text-xl font-black text-white">{t.settings}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-8">
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-cyan-400" />
              {t.preferences}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  {t.language}
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0f1729] text-white">
                      {opt.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" />
                  {t.currency}
                </span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0f1729] text-white">
                      {currencyMeta[opt].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  {t.theme}
                </span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="light" className="bg-[#0f1729] text-white">
                    {t.light}
                  </option>
                  <option value="dark" className="bg-[#0f1729] text-white">
                    {t.dark}
                  </option>
                </select>
              </label>
            </div>
          </div>

          {session && (
            <>
              <hr className="border-white/[0.06]" />

              {/* Profile */}
              <form onSubmit={onProfileSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-white">{t.updateProfile}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5 sm:col-span-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.email}
                    </span>
                    <input
                      readOnly
                      value={account?.email ?? session.email}
                      className="w-full bg-white/[0.02] border border-transparent rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.displayName}
                    </span>
                    <input
                      value={accountForm.displayName}
                      onChange={(e) =>
                        setAccountForm((c) => ({ ...c, displayName: e.target.value }))
                      }
                      maxLength={120}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.phone}
                    </span>
                    <input
                      value={accountForm.phoneNumber}
                      onChange={(e) =>
                        setAccountForm((c) => ({ ...c, phoneNumber: e.target.value }))
                      }
                      maxLength={32}
                      placeholder="+90 5xx xxx xx xx"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-bold text-white hover:bg-white/[0.1] disabled:opacity-50 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.updateProfile}
                </button>
              </form>

              <hr className="border-white/[0.06]" />

              {/* Password */}
              <form onSubmit={onPasswordSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  {t.security}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.currentPassword}
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.newPassword}
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.confirmPassword}
                    </span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-bold text-white hover:bg-white/[0.1] disabled:opacity-50 transition-all"
                >
                  {t.changePassword}
                </button>
              </form>

              <hr className="border-white/[0.06]" />

              {/* Danger Zone */}
              <form onSubmit={onDeleteSubmit} className="space-y-4 bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    {t.deleteAccount}
                  </h3>
                  <p className="text-xs text-slate-400">{t.confirmDelete}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.email}
                    </span>
                    <input
                      type="email"
                      required
                      value={deleteForm.emailConfirmation}
                      onChange={(e) =>
                        setDeleteForm((c) => ({ ...c, emailConfirmation: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t.password}
                    </span>
                    <input
                      type="password"
                      required
                      value={deleteForm.password}
                      onChange={(e) =>
                        setDeleteForm((c) => ({ ...c, password: e.target.value }))
                      }
                      className="w-full bg-white/[0.04] border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all"
                >
                  {t.deleteAccount}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
