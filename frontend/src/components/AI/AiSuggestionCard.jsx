import React, { useEffect, useMemo, useState } from 'react';
import { queryAi } from '../../api/client';
import { useCurrency } from '../../context/CurrencyContext';

const suggestionCache = new Map();

export default function AiSuggestionCard({
  session,
  portfolio,
  prices = [],
  variant = 'market',
  className = '',
  onAuthClick,
}) {
  const { money } = useCurrency();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryKey = useMemo(() => {
    if (!session?.token) return 'guest';
    const sessionKey = session.email || session.user?.email || session.token;
    const holdings = portfolio?.holdings
      ?.map((holding) => `${holding.symbol}:${holding.quantity}`)
      .join('|') ?? 'no-portfolio';
    return `${sessionKey}:${variant}:${holdings}`;
  }, [portfolio, session, variant]);

  useEffect(() => {
    if (!session?.token) return;
    if (variant === 'market' && prices.length === 0) return;
    if (variant === 'portfolio' && !portfolio) return;

    const cached = suggestionCache.get(queryKey);
    if (cached?.status === 'done') {
      setAnswer(cached.answer);
      setError('');
      setLoading(false);
      return;
    }
    if (cached?.status === 'error') {
      setAnswer('');
      setError(cached.error);
      setLoading(false);
      return;
    }
    if (cached?.status === 'loading') {
      let cancelled = false;
      setAnswer('');
      setError('');
      setLoading(true);
      cached.promise
        .then((answerText) => {
          if (!cancelled) setAnswer(answerText);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || 'AI onerisi alinamadi.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    const topMarkets = prices
      .slice(0, 5)
      .map((asset) => {
        const change = asset.change24h ?? asset.changePercent ?? 0;
        return `${asset.symbol}: ${money(asset.price)} (${Number(change).toFixed(2)}%)`;
      })
      .join(', ');

    const holdings = portfolio?.holdings
      ?.slice(0, 6)
      ?.map((holding) => `${holding.symbol}: ${Number(holding.quantity).toLocaleString('tr-TR')}`)
      .join(', ') || 'Portfoy bilgisi yok';

    const prompt = variant === 'portfolio'
      ? `Kullanici cuzdan ekranini acti. Portfoy: ${holdings}. Piyasalar: ${topMarkets}. Bu portfoye gore 2-3 kisa gozlem ve dikkat edilecek noktalari yaz. Kesin al/sat emri verme.`
      : `Kullanici ana sayfada piyasalari inceliyor. Piyasalar: ${topMarkets}. Trend olanlar ile tum piyasalar arasinda gosterilecek 2-3 kisa AI piyasa onerisi yaz. Kesin al/sat emri verme.`;

    let cancelled = false;
    setAnswer('');
    setError('');
    setLoading(true);

    const promise = queryAi(session.token, prompt)
      .then((res) => {
        suggestionCache.set(queryKey, { status: 'done', answer: res.answer });
        return res.answer;
      })
      .catch((err) => {
        const message = err.message || 'AI onerisi alinamadi.';
        suggestionCache.set(queryKey, { status: 'error', error: message });
        throw new Error(message);
      });

    suggestionCache.set(queryKey, { status: 'loading', promise });

    promise
      .then((answerText) => {
        if (!cancelled) setAnswer(answerText);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'AI onerisi alinamadi.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [money, portfolio, prices, queryKey, session?.token, variant]);

  if (!session?.token) {
    return (
      <section className={`glass-panel rounded-xl p-lg border border-primary-container/20 ${className}`}>
        <div className="flex items-center gap-sm mb-sm">
          <span className="material-symbols-outlined text-primary-container">smart_toy</span>
          <h2 className="font-headline-md text-on-surface">AI Destegi</h2>
        </div>
        <p className="text-on-surface-variant text-sm">AI destegi icin hesabiniza giris yapiniz.</p>
        {onAuthClick && (
          <button
            type="button"
            onClick={onAuthClick}
            className="mt-md bg-primary-container text-on-primary-container px-lg py-sm rounded-DEFAULT font-label-caps uppercase hover:glow-bloom transition-all"
          >
            Giris Yap
          </button>
        )}
      </section>
    );
  }

  return (
    <section className={`glass-panel rounded-xl p-lg border border-primary-container/20 ${className}`}>
      <div className="flex items-center justify-between gap-md mb-sm">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary-container">psychology</span>
          <h2 className="font-headline-md text-on-surface">AI Destegi</h2>
        </div>
        {loading && (
          <span className="material-symbols-outlined text-primary-container text-lg animate-spin">hourglass_empty</span>
        )}
      </div>

      {loading && !answer && (
        <p className="text-on-surface-variant text-sm">Portfoy ve piyasa verilerine gore oneri hazirlaniyor...</p>
      )}

      {error && (
        <p className="text-error text-sm">{error}</p>
      )}

      {answer && (
        <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">{answer}</p>
      )}
    </section>
  );
}
