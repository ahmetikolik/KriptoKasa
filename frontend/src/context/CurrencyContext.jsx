import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fallbackRates, formatMoney } from '../data/constants';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency === 'TRY' || savedCurrency === 'USD' ? savedCurrency : 'USD';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const value = useMemo(() => {
    const toggleCurrency = () => {
      setCurrency((prev) => (prev === 'USD' ? 'TRY' : 'USD'));
    };

    const money = (usdValue) => formatMoney(usdValue, currency, fallbackRates);

    return {
      currency,
      setCurrency,
      toggleCurrency,
      money,
      rates: fallbackRates,
    };
  }, [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
