import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Navbar({ activeView, setActiveView, onAuthClick, onLogout, session }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/75 backdrop-blur-md border-b border-white/10 shadow-[0px_0px_15px_rgba(0,209,255,0.2)]">
      <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop py-md max-w-max-width mx-auto">
        <div className="flex items-center gap-xl">
          <button onClick={() => setActiveView('home')} className="font-display-lg text-headline-md text-primary-container tracking-tighter">
            KriptoKasa
          </button>
          <nav className="hidden md:flex gap-lg font-body-base text-body-base">
            <button onClick={() => setActiveView('home')} className={`transition-all ${activeView === 'home' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`}>{t('nav.home')}</button>
            <button onClick={() => setActiveView('trade')} className={`transition-all ${activeView === 'trade' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`}>{t('nav.trade')}</button>
            <button onClick={() => setActiveView('dashboard')} className={`transition-all ${activeView === 'dashboard' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`}>{t('nav.portfolio')}</button>
            <button onClick={() => setActiveView('news')} className={`transition-all ${activeView === 'news' ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary-container'}`}>{t('nav.news')}</button>
          </nav>
        </div>
        <div className="flex items-center gap-md">
          {/* Theme & Language Toggles */}
          <button onClick={toggleLanguage} className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-surface-container-high text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all">
            <span className="font-label-caps text-[10px] tracking-wider uppercase font-bold">{lang}</span>
          </button>
          <button onClick={toggleTheme} className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-surface-container-high text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all">
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          <button className="text-on-surface-variant hover:text-primary-container transition-all hidden md:block ml-2">
            <span className="material-symbols-outlined" data-icon="search">search</span>
          </button>

          {session ? (
            <div className="flex items-center gap-2 border border-white/10 px-4 py-2 rounded-lg bg-surface-container-high ml-2">
              <span className="text-on-surface-variant font-tech-mono text-sm">{session.user?.email || 'Connected'}</span>
              <div className="w-px h-4 bg-white/20 mx-1"></div>
              <button onClick={onLogout} title="Çıkış Yap" className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          ) : (
            <button onClick={onAuthClick} className="bg-primary-container text-on-primary-container px-lg py-sm rounded-DEFAULT font-label-caps uppercase hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] hover:glow-bloom transition-all tracking-widest ml-2">
              {t('nav.connectWallet')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
