'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getPreferredCurrency, 
  setPreferredCurrency as savePreferredCurrency,
  convertPrice,
  formatPrice as formatPriceUtil,
  getCurrencySymbol
} from '@/lib/utils-currency-client';

const CurrencyContext = createContext({
  currency: 'USD',
  setCurrency: () => {},
  convertPrice: () => 0,
  formatPrice: () => '',
  getCurrencySymbol: () => '$',
});

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('USD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load preferred currency on mount
    const preferred = getPreferredCurrency();
    setCurrencyState(preferred);
    setMounted(true);
  }, []);

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    savePreferredCurrency(newCurrency);
  };

  const convertPriceWithCurrency = (cents, fromCurrency = 'USD') => {
    if (fromCurrency === currency) return cents;
    return convertPrice(cents, fromCurrency, currency);
  };

  const formatPrice = (cents, fromCurrency = 'USD') => {
    const convertedCents = convertPriceWithCurrency(cents, fromCurrency);
    return formatPriceUtil(convertedCents, currency);
  };

  const value = {
    currency,
    setCurrency,
    convertPrice: convertPriceWithCurrency,
    formatPrice,
    getCurrencySymbol: () => getCurrencySymbol(currency),
    mounted,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Made with Bob
