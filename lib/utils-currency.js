/**
 * Currency utilities for multi-currency support
 * Handles currency detection, conversion, and formatting
 */

// Supported currencies with their configurations
export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    stripeCode: 'usd',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    stripeCode: 'eur',
    decimalPlaces: 2,
  },
};

// EU countries that should default to EUR
export const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
];

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
 * Detect currency from browser/request
 * @param {Request} request - Next.js request object
 * @returns {string} Currency code
 */
export function detectCurrency(request) {
  // Try to get from cookie first
  const cookies = request?.cookies;
  if (cookies) {
    const currencyCookie = cookies.get('preferred_currency');
    if (currencyCookie && CURRENCIES[currencyCookie.value]) {
      return currencyCookie.value;
    }
  }

  // Try to detect from Accept-Language header
  const acceptLanguage = request?.headers?.get('accept-language');
  if (acceptLanguage) {
    // Check for European locales
    if (acceptLanguage.includes('de') || 
        acceptLanguage.includes('fr') || 
        acceptLanguage.includes('es') ||
        acceptLanguage.includes('it') ||
        acceptLanguage.includes('nl')) {
      return 'EUR';
    }
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
 * Convert price between currencies using exchange rate
 * @param {number} cents - Price in cents
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} exchangeRate - Exchange rate (optional, uses default if not provided)
 * @returns {number} Converted price in cents
 */
export function convertPrice(cents, fromCurrency, toCurrency, exchangeRate = null) {
  if (fromCurrency === toCurrency) return cents;
  
  // Use provided exchange rate or fetch from environment/API
  let rate = exchangeRate;
  
  if (!rate) {
    // Default exchange rates (should be updated regularly or fetched from API)
    // These are approximate rates and should be replaced with real-time rates in production
    if (fromCurrency === 'USD' && toCurrency === 'EUR') {
      rate = parseFloat(process.env.USD_TO_EUR_RATE || '0.92');
    } else if (fromCurrency === 'EUR' && toCurrency === 'USD') {
      rate = parseFloat(process.env.EUR_TO_USD_RATE || '1.09');
    } else {
      rate = 1; // Fallback
    }
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
 * Validate currency code
 * @param {string} currency - Currency code to validate
 * @returns {boolean} True if valid
 */
export function isValidCurrency(currency) {
  return currency && CURRENCIES[currency] !== undefined;
}

/**
 * Get all supported currencies
 * @returns {Array} Array of currency codes
 */
export function getSupportedCurrencies() {
  return Object.keys(CURRENCIES);
}

/**
 * Parse price string to cents
 * @param {string} priceString - Price string (e.g., "19.99", "€19,99")
 * @param {string} currency - Currency code
 * @returns {number} Price in cents
 */
export function parsePriceToCents(priceString, currency = 'USD') {
  if (!priceString) return 0;
  
  // Remove currency symbols and spaces
  let cleaned = priceString.replace(/[€$\s]/g, '');
  
  // Handle European decimal separator (comma)
  if (currency === 'EUR') {
    cleaned = cleaned.replace(',', '.');
  }
  
  const amount = parseFloat(cleaned);
  return Math.round(amount * 100);
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
 * Format cents as decimal (for API/calculations)
 * @param {number} cents - Price in cents
 * @returns {number} Price as decimal
 */
export function centsToDecimal(cents) {
  return cents / 100;
}

/**
 * Convert decimal to cents
 * @param {number} decimal - Price as decimal
 * @returns {number} Price in cents
 */
export function decimalToCents(decimal) {
  return Math.round(decimal * 100);
}

// Made with Bob
