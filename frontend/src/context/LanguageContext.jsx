import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  tr: {
    // Navbar
    'nav.home': 'Ana Sayfa',
    'nav.portfolio': 'Cüzdan',
    'nav.trade': 'Al/Sat',
    'nav.connectWallet': 'Connect Wallet',
    'nav.login': 'Giriş Yap',
    'nav.news': 'Haberler',
    
    // News
    'news.title': 'Kripto Haberler',
    'news.fetchError': 'Haberler yüklenirken bir sorun oluştu.',
    'news.readMore': 'Devamını Oku',
    // Home
    'home.hero.title': 'Geleceğin Finansına',
    'home.hero.titleHighlight': 'Hükmedin.',
    'home.hero.subtitle': 'KriptoKasa ile en hızlı, en güvenli ve en modern kripto deneyimi.',
    'home.hero.start': 'Hemen Başla',
    'home.hero.markets': 'Piyasaları İncele',
    'home.markets.title': 'Tüm Piyasalar',
    'home.markets.asset': 'Varlık',
    'home.markets.change': '24s Değişim',
    'home.trending.title': 'Trend Olanlar',
    'home.trending.gainers': 'En Çok Kazandıranlar',
    'home.trending.losers': 'En Çok Kaybedenler',
    'home.trending.popular': 'Popüler',
    
    // Auth
    'auth.title': 'Giriş Yap',
    'auth.login': 'Giriş Yap',
    'auth.create': 'Kayıt Ol',
    'auth.email': 'E-posta',
    'auth.password': 'Şifre',
    'auth.submit': 'Devam Et',
    'auth.loading': 'Bekleniyor...',
    'auth.wallet': 'Cüzdan',
    'auth.settings': 'Ayarlar',
    'auth.signOut': 'Çıkış Yap',
    'auth.mockNotice': 'Not: Şifreniz "password" olmalıdır. Tüm veriler yerel olarak tutulmaktadır.',
    
    // Trade
    'trade.market': 'Piyasa',
    'trade.limit': 'Limit',
    'trade.stop': 'Stop',
    'trade.buy': 'AL',
    'trade.sell': 'SAT',
    'trade.available': 'Kullanılabilir',
    'trade.quantity': 'Miktar',
    'trade.price': 'Fiyat',
    'trade.stopPrice': 'Stop Fiyatı',
    'trade.total': 'Toplam',
    'trade.submitBuy': 'AL',
    'trade.submitSell': 'SAT',
    'trade.orderBook.title': 'Emir Defteri',
    'trade.orderBook.price': 'Fiyat',
    'trade.orderBook.amount': 'Miktar',
    'trade.orderBook.total': 'Toplam',
    'trade.history.title': 'Piyasa Geçmişi',
    'trade.history.time': 'Zaman',
    
    // Portfolio
    'portfolio.title': 'Cüzdan Özeti',
    'portfolio.totalValue': 'Toplam Varlık Değeri',
    'portfolio.fiatBalance': 'Kullanılabilir Bakiye (USD)',
    'portfolio.profit24h': '24S Kar/Zarar',
    'portfolio.holdings': 'Varlıklarım',
    'portfolio.asset': 'Varlık',
    'portfolio.balance': 'Bakiye',
    'portfolio.value': 'Değer',
    'portfolio.recentTransactions': 'Son İşlemler',
    'portfolio.txType': 'İşlem',
    'portfolio.txAmount': 'Miktar',
    'portfolio.txPrice': 'Fiyat',
    'portfolio.txDate': 'Tarih'
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.portfolio': 'Portfolio',
    'nav.trade': 'Trade',
    'nav.connectWallet': 'Connect Wallet',
    'nav.login': 'Log In',
    'nav.news': 'News',
    
    // News
    'news.title': 'Crypto News',
    'news.fetchError': 'Failed to load news.',
    'news.readMore': 'Read More',
    // Home
    'home.hero.title': 'Dominate the',
    'home.hero.titleHighlight': 'Future of Finance.',
    'home.hero.subtitle': 'The fastest, most secure, and modern crypto experience with KriptoKasa.',
    'home.hero.start': 'Get Started',
    'home.hero.markets': 'Explore Markets',
    'home.markets.title': 'All Markets',
    'home.markets.asset': 'Asset',
    'home.markets.change': '24h Change',
    'home.trending.title': 'Trending',
    'home.trending.gainers': 'Top Gainers',
    'home.trending.losers': 'Top Losers',
    'home.trending.popular': 'Popular',
    
    // Auth
    'auth.title': 'Sign In',
    'auth.login': 'Log In',
    'auth.create': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submit': 'Continue',
    'auth.loading': 'Loading...',
    'auth.wallet': 'Wallet',
    'auth.settings': 'Settings',
    'auth.signOut': 'Sign Out',
    'auth.mockNotice': 'Note: Password must be "password". All data is stored locally.',
    
    // Trade
    'trade.market': 'Market',
    'trade.limit': 'Limit',
    'trade.stop': 'Stop',
    'trade.buy': 'BUY',
    'trade.sell': 'SELL',
    'trade.available': 'Available',
    'trade.quantity': 'Amount',
    'trade.price': 'Price',
    'trade.stopPrice': 'Stop Price',
    'trade.total': 'Total',
    'trade.submitBuy': 'BUY',
    'trade.submitSell': 'SELL',
    'trade.orderBook.title': 'Order Book',
    'trade.orderBook.price': 'Price',
    'trade.orderBook.amount': 'Amount',
    'trade.orderBook.total': 'Total',
    'trade.history.title': 'Recent Trades',
    'trade.history.time': 'Time',
    
    // Portfolio
    'portfolio.title': 'Portfolio Summary',
    'portfolio.totalValue': 'Total Asset Value',
    'portfolio.fiatBalance': 'Available Balance (USD)',
    'portfolio.profit24h': '24h P&L',
    'portfolio.holdings': 'My Holdings',
    'portfolio.asset': 'Asset',
    'portfolio.balance': 'Balance',
    'portfolio.value': 'Value',
    'portfolio.recentTransactions': 'Recent Transactions',
    'portfolio.txType': 'Type',
    'portfolio.txAmount': 'Amount',
    'portfolio.txPrice': 'Price',
    'portfolio.txDate': 'Date'
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) return savedLang;
    
    const userLang = navigator.language || navigator.userLanguage;
    return userLang.startsWith('tr') ? 'tr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'tr' ? 'en' : 'tr');
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
