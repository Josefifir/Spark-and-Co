'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { t, getNamespace, getSupportedLocales, isLocaleSupported } from './translations';

const LocaleContext = createContext({
  locale: 'en',
  setLocale: () => {},
  t: () => '',
  getNamespace: () => ({}),
});

/**
 * Get user's preferred locale from localStorage or browser
 * @returns {string} Locale code
 */
function getPreferredLocale() {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first
  try {
    const stored = localStorage.getItem('preferred_locale');
    if (stored && isLocaleSupported(stored)) {
      return stored;
    }
  } catch (e) {
    // localStorage not available
  }

  // Detect from browser language
  const browserLang = navigator.language || navigator.userLanguage;
  
  if (browserLang.startsWith('de')) {
    return 'de';
  }

  return 'en';
}

/**
 * Save preferred locale to localStorage and cookie
 * @param {string} locale - Locale code
 */
function savePreferredLocale(locale) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('preferred_locale', locale);
    // Also set cookie for server-side detection
    document.cookie = `preferred_locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    // localStorage not available
  }
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load preferred locale on mount
    const preferred = getPreferredLocale();
    setLocaleState(preferred);
    setMounted(true);
  }, []);

  const setLocale = (newLocale) => {
    if (isLocaleSupported(newLocale)) {
      setLocaleState(newLocale);
      savePreferredLocale(newLocale);
    }
  };

  const translate = (key, params) => t(key, locale, params);
  const getNamespaceTranslations = (namespace) => getNamespace(namespace, locale);

  const value = {
    locale,
    setLocale,
    t: translate,
    getNamespace: getNamespaceTranslations,
    mounted,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to use translations in components
 * @returns {object} Locale context
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

/**
 * Hook to get translations for a specific namespace
 * @param {string} namespace - Namespace (e.g., 'common', 'product')
 * @returns {object} Translations object
 */
export function useTranslations(namespace) {
  const { getNamespace, locale } = useLocale();
  return getNamespace(namespace);
}

/**
 * Get supported locales list
 * @returns {Array} Array of locale objects
 */
export function getLocales() {
  return [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];
}

// Made with Bob
