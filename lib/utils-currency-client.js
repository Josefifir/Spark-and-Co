/**
 * Client-safe currency utilities
 * Can be imported in React components without server dependencies
 */

// Supported currencies with their configurations
export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimalPlaces: 2,
  },
};

// Eurozone countries (use EUR as currency)
export const EUROZONE_COUNTRIES = [
  'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
];

/**
 * Get currency based on country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Currency code (USD or EUR)
 */
export function getCurrencyForCountry(countryCode) {
  if (!countryCode) return 'USD';
  
  const upperCode = countryCode.toUpperCase();
  
  // Eurozone countries use EUR
  if (EUROZONE_COUNTRIES.includes(upperCode)) {
    return 'EUR';
  }
  
  // Default to USD
  return 'USD';
}

/**
 * Format price in cents to display string
 * @param {number} cents - Price in cents
 * @param {string} currency - Currency code (USD or EUR)
 * @returns {string} Formatted price string
 */
export function formatPrice(cents, currency = 'USD') {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  const amount = cents / 100;
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount);
}

/**
 * Convert price between currencies using approximate exchange rate
 * @param {number} cents - Price in cents
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {number} Converted price in cents
 */
export function convertPrice(cents, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return cents;
  
  // Approximate exchange rates (client-side estimation)
  // Server will use accurate rates from environment variables
  let rate = 1;
  
  if (fromCurrency === 'USD' && toCurrency === 'EUR') {
    rate = 0.92; // Approximate USD to EUR
  } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
    rate = 1.09; // Approximate EUR to USD
  }
  
  return Math.round(cents * rate);
}

/**
 * Get currency configuration
 * @param {string} currency - Currency code
 * @returns {object} Currency configuration
 */
export function getCurrencyConfig(currency = 'USD') {
  return CURRENCIES[currency] || CURRENCIES.USD;
}

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currency = 'USD') {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  return config.symbol;
}

/**
 * Get user's preferred currency from localStorage
 * @returns {string} Currency code
 */
export function getPreferredCurrency() {
  if (typeof window === 'undefined') return 'USD';
  
  try {
    const stored = localStorage.getItem('preferred_currency');
    if (stored && CURRENCIES[stored]) {
      return stored;
    }
  } catch (e) {
    // localStorage not available
  }
  
  return 'USD';
}

/**
 * Set user's preferred currency in localStorage
 * @param {string} currency - Currency code
 */
export function setPreferredCurrency(currency) {
  if (typeof window === 'undefined') return;
  
  if (CURRENCIES[currency]) {
    try {
      localStorage.setItem('preferred_currency', currency);
      // Also set cookie for server-side detection
      document.cookie = `preferred_currency=${currency}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // localStorage not available
    }
  }
}

/**
 * Detect currency from browser locale
 * @returns {string} Currency code
 */
export function detectCurrencyFromLocale() {
  if (typeof window === 'undefined') return 'USD';
  
  const locale = navigator.language || navigator.userLanguage;
  
  // Check for European locales
  if (locale.startsWith('de') || 
      locale.startsWith('fr') || 
      locale.startsWith('es') ||
      locale.startsWith('it') ||
      locale.startsWith('nl') ||
      locale.startsWith('pt') ||
      locale.startsWith('el') ||
      locale.startsWith('fi') ||
      locale.startsWith('sv')) {
    return 'EUR';
  }
  
  return 'USD';
}

/**
 * Get all supported currencies
 * @returns {Array} Array of currency objects
 */
export function getSupportedCurrencies() {
  return Object.values(CURRENCIES);
}

// Made with Bob
