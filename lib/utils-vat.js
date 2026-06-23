// VAT rates for EU countries (as of 2024)
// Source: https://ec.europa.eu/taxation_customs/tedb/taxSearch.html
export const VAT_RATES = {
  AT: 20, // Austria
  BE: 21, // Belgium
  BG: 20, // Bulgaria
  HR: 25, // Croatia
  CY: 19, // Cyprus
  CZ: 21, // Czech Republic
  DK: 25, // Denmark
  EE: 24, // Estonia
  FI: 25.5, // Finland
  FR: 20, // France
  DE: 19, // Germany
  GR: 24, // Greece
  HU: 27, // Hungary
  IE: 23, // Ireland
  IT: 22, // Italy
  LV: 21, // Latvia
  LT: 21, // Lithuania
  LU: 17, // Luxembourg
  MT: 18, // Malta
  NL: 21, // Netherlands
  PL: 23, // Poland
  PT: 23, // Portugal
  RO: 19, // Romania
  SK: 20, // Slovakia
  SI: 22, // Slovenia
  ES: 21, // Spain
  SE: 25, // Sweden
  // Non-EU but EEA
  NO: 25, // Norway
  IS: 24, // Iceland
  LI: 8.1, // Liechtenstein
  CH: 8.1, // Switzerland (not EU but often included)
};

// Reduced VAT rates for specific product categories (optional)
export const REDUCED_VAT_RATES = {
  DE: {
    books: 7,
    food: 7,
    medical: 7,
  },
  // Add other countries as needed
};

/**
 * Get VAT rate for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @param {string} productCategory - Optional product category for reduced rates
 * @returns {number} VAT rate as percentage (e.g., 19 for 19%)
 */
export function getVATRate(countryCode, productCategory = null) {
  if (!countryCode) return 0;
  
  const code = countryCode.toUpperCase();
  
  // Check for reduced rate if category provided
  if (productCategory && REDUCED_VAT_RATES[code]?.[productCategory]) {
    return REDUCED_VAT_RATES[code][productCategory];
  }
  
  // Return standard rate or 0 if not in EU
  return VAT_RATES[code] || 0;
}

/**
 * Check if country is in EU/EEA and requires VAT
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {boolean}
 */
export function isEUCountry(countryCode) {
  if (!countryCode) return false;
  return countryCode.toUpperCase() in VAT_RATES;
}

/**
 * Calculate VAT amount from net price
 * @param {number} netPriceCents - Price without VAT in cents
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} VAT amount in cents
 */
export function calculateVATFromNet(netPriceCents, vatRate) {
  return Math.round(netPriceCents * (vatRate / 100));
}

/**
 * Calculate net price from gross price (VAT-inclusive)
 * @param {number} grossPriceCents - Price with VAT in cents
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} Net price in cents
 */
export function calculateNetFromGross(grossPriceCents, vatRate) {
  return Math.round(grossPriceCents / (1 + vatRate / 100));
}

/**
 * Calculate gross price from net price
 * @param {number} netPriceCents - Price without VAT in cents
 * @param {number} vatRate - VAT rate as percentage
 * @returns {number} Gross price in cents
 */
export function calculateGrossFromNet(netPriceCents, vatRate) {
  return netPriceCents + calculateVATFromNet(netPriceCents, vatRate);
}

/**
 * Calculate VAT breakdown for an order
 * @param {number} subtotalCents - Subtotal in cents (can be net or gross depending on priceIncludesVAT)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @param {boolean} priceIncludesVAT - Whether the subtotal already includes VAT
 * @returns {object} VAT breakdown
 */
export function calculateOrderVAT(subtotalCents, countryCode, priceIncludesVAT = true) {
  const vatRate = getVATRate(countryCode);
  
  if (vatRate === 0) {
    // No VAT for non-EU countries
    return {
      vatRate: 0,
      netAmount: subtotalCents,
      vatAmount: 0,
      grossAmount: subtotalCents,
      priceIncludesVAT: false,
    };
  }
  
  let netAmount, vatAmount, grossAmount;
  
  if (priceIncludesVAT) {
    // Prices already include VAT (common in EU)
    grossAmount = subtotalCents;
    netAmount = calculateNetFromGross(grossAmount, vatRate);
    vatAmount = grossAmount - netAmount;
  } else {
    // Prices don't include VAT (add VAT on top)
    netAmount = subtotalCents;
    vatAmount = calculateVATFromNet(netAmount, vatRate);
    grossAmount = netAmount + vatAmount;
  }
  
  return {
    vatRate,
    netAmount,
    vatAmount,
    grossAmount,
    priceIncludesVAT,
    countryCode: countryCode.toUpperCase(),
  };
}

/**
 * Format VAT breakdown for display
 * @param {object} vatBreakdown - Result from calculateOrderVAT
 * @param {string} currency - Currency code (EUR, USD, etc.)
 * @returns {object} Formatted strings for display
 */
export function formatVATBreakdown(vatBreakdown, currency = "EUR") {
  const formatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency,
  });
  
  return {
    netAmount: formatter.format(vatBreakdown.netAmount / 100),
    vatAmount: formatter.format(vatBreakdown.vatAmount / 100),
    grossAmount: formatter.format(vatBreakdown.grossAmount / 100),
    vatRate: `${vatBreakdown.vatRate}%`,
    vatLabel: `MwSt. ${vatBreakdown.vatRate}%`, // German: Mehrwertsteuer
  };
}

/**
 * Determine if business customer (B2B) is VAT exempt
 * Requires valid VAT ID verification (not implemented here)
 * @param {string} vatId - EU VAT identification number
 * @param {string} customerCountry - Customer's country code
 * @param {string} sellerCountry - Seller's country code
 * @returns {boolean}
 */
export function isVATExempt(vatId, customerCountry, sellerCountry = "DE") {
  // Simplified logic - in production, verify VAT ID with VIES
  // https://ec.europa.eu/taxation_customs/vies/
  
  if (!vatId) return false;
  
  // B2B reverse charge: If customer is in different EU country with valid VAT ID
  if (
    customerCountry !== sellerCountry &&
    isEUCountry(customerCountry) &&
    vatId.length > 0
  ) {
    return true;
  }
  
  return false;
}

/**
 * Get VAT display text based on country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @param {string} locale - Locale for translation (en, de)
 * @returns {string}
 */
export function getVATDisplayText(countryCode, locale = "en") {
  const vatRate = getVATRate(countryCode);
  
  if (vatRate === 0) {
    return locale === "de" ? "Keine MwSt." : "No VAT";
  }
  
  if (locale === "de") {
    return `inkl. ${vatRate}% MwSt.`;
  }
  
  return `incl. ${vatRate}% VAT`;
}

/**
 * Validate EU VAT ID format (basic check)
 * @param {string} vatId - VAT ID to validate
 * @returns {boolean}
 */
export function validateVATIDFormat(vatId) {
  if (!vatId) return false;
  
  // Basic format check - country code + digits
  // Real validation should use VIES API
  const vatRegex = /^[A-Z]{2}[0-9A-Z]{2,13}$/;
  return vatRegex.test(vatId.toUpperCase().replace(/\s/g, ""));
}

// Made with Bob
