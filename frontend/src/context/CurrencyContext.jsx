import React, { createContext, useState, useContext } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1.0, flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095, flag: '🇬🇧' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 1.8, flag: '🇯🇵' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.018, flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.016, flag: '🇨🇦' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', rate: 0.044, flag: '🇦🇪' },
};

export const CurrencyProvider = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState(() => {
    return localStorage.getItem('gt_currency') || 'INR';
  });

  const currency = CURRENCIES[currencyCode] || CURRENCIES.INR;

  const changeCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrencyCode(code);
      localStorage.setItem('gt_currency', code);
    }
  };

  // Convert amount from base (INR) to selected currency with symbol
  const formatAmount = (amountInBase) => {
    if (amountInBase === null || amountInBase === undefined) return `${currency.symbol}0`;
    const num = Number(amountInBase) || 0;
    const converted = num * currency.rate;
    const formattedNum = currency.code === 'JPY'
      ? Math.round(converted).toLocaleString()
      : converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return `${currency.symbol}${formattedNum}`;
  };

  // Convert entered input amount in selected currency back to base (INR) for database saving
  const convertToBase = (amountInSelected) => {
    if (!amountInSelected) return 0;
    return Number(amountInSelected) / currency.rate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        currency,
        currencies: Object.values(CURRENCIES),
        changeCurrency,
        formatAmount,
        convertToBase,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
