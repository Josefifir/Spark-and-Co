/**
 * Translation system for multi-language support
 * Currently supports: English (en) and German (de)
 */

export const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      remove: 'Remove',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
    },

    // Header/Navigation
    nav: {
      allLighters: 'All Lighters',
      torch: 'Torch',
      refillable: 'Refillable',
      electric: 'Electric',
      lighterFuel: 'Lighter Fuel',
      cart: 'Cart',
      encryptedCheckout: 'ENCRYPTED CHECKOUT',
    },

    // Homepage
    home: {
      nowShipping: 'NOW SHIPPING — SPEC-BUILT EDC LIGHTERS',
      heroTitle1: 'Built to',
      heroTitle2: 'ignite',
      heroTitle3: 'engineered to last.',
      heroDescription: 'Machined torch, electric, and refillable lighters for people who carry tools, not trinkets. Every unit spec\'d, tested, and backed.',
      shopLineup: 'Shop the lineup',
      torchLighters: 'Torch lighters →',
      tlsEncrypted: 'TLS-encrypted checkout',
      noCardData: 'No card data stored',
      bitcoinAccepted: 'Bitcoin accepted',
      sepaAccepted: 'Bitcoin & SEPA accepted',
      discreetPackaging: 'Discreet packaging',
      catalogLabel: '01 / CATALOG',
      featuredLighters: 'Featured lighters',
      viewAll: 'View all →',
      noProducts: 'No products yet. Add some from the admin dashboard.',
      ageWarning: 'Must be 18+ to purchase. Lighters are restricted items in some regions — check local regulations before ordering. Keep out of reach of children.',
      security: 'SECURITY',
      brandName: 'STRIKE & CO.',
      brandTagline: 'Machined lighters for everyday carry. Built to spec, lit to last.',
    },

    // Product
    product: {
      addToCart: 'Add to Cart',
      outOfStock: 'Out of Stock',
      inStock: '{count} in stock',
      price: 'Price',
      description: 'Description',
      features: 'Features',
      specifications: 'Specifications',
      reviews: 'Reviews',
      rating: 'Rating',
      bulkDiscount: 'BULK DISCOUNT',
      bulkPricing: 'Bulk Pricing',
      buyXGetYOff: 'Buy {min}+ get {discount}% off',
      ageRestricted: 'Age Restricted (18+)',
      category: 'Category',
      sku: 'SKU',
      quantity: 'Qty',
      encryptedCheckout: 'Encrypted checkout, card or Bitcoin',
      ageRestriction: 'Must be 18+ to purchase',
      relatedProducts: 'Related products',
      onlyXLeft: 'ONLY {count} LEFT',
    },

    // Products Listing
    products: {
      catalog: 'CATALOG',
      allLighters: 'All lighters',
      all: 'All',
      noProducts: 'No products found in this category.',
    },

    // Cart
    cart: {
      title: 'Your cart',
      empty: 'Your cart is empty',
      emptyDescription: 'Nothing here yet. Go find something worth carrying.',
      browseLighters: 'Browse lighters',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Total',
      proceedToCheckout: 'Proceed to checkout',
      continueShopping: 'Continue Shopping',
      quantity: 'Quantity',
      remove: 'Remove',
      bulkSavings: 'Bulk Savings',
      youSave: 'You save',
      appliedDiscount: 'Applied {discount}% bulk discount',
      bulkDiscountApplied: 'Bulk discount applied!',
      savingAmount: "You're saving {amount} with bulk pricing",
      bulkDiscountSavings: 'Bulk discount savings',
      off: 'off',
      checkoutNote: 'Bulk pricing applied automatically. Shipping and tax calculated at checkout.',
      decreaseQuantity: 'Decrease quantity',
      increaseQuantity: 'Increase quantity',
      removeItem: 'Remove {name}',
    },

    // Checkout
    checkout: {
      title: 'Checkout',
      contact: 'Contact',
      shippingAddress: 'Shipping address',
      paymentMethod: 'Payment method',
      orderSummary: 'Order summary',
      placeOrder: 'Place Order',
      processing: 'Processing...',
      fullName: 'Full name',
      email: 'Email',
      addressLine1: 'Address line 1',
      addressLine2: 'Address line 2 (optional)',
      city: 'City',
      state: 'State / Province',
      postalCode: 'Postal code',
      country: 'Country',
      ageVerification: 'Age Verification',
      ageConfirmation: 'I confirm that I am 18 years of age or older and am legally permitted to purchase lighters in my jurisdiction.',
      confirmAge: 'I confirm that I am 18 years or older',
      card: 'Card',
      cryptocurrency: 'Cryptocurrency',
      sepa: 'SEPA Direct Debit',
      subtotal: 'Subtotal',
      total: 'Total',
      discount: 'Discount',
      netAmount: 'Net amount',
      vat: 'VAT',
      promoCode: 'Promo code',
      enterPromoCode: 'Enter promo code',
      apply: 'Apply',
      secureCheckout: 'Secure, encrypted checkout',
      securePayment: 'Your payment details are encrypted and never touch our servers.',
      continueToPayment: 'Continue to payment',
      continueToBitcoin: 'Continue to Bitcoin payment',
      continueToSepa: 'Continue to SEPA payment',
      addBeforeCheckout: 'Add something before checking out.',
      payment: 'Payment',
      sepaDirectDebit: 'SEPA Direct Debit',
      orderNumber: 'Order',
      completePayment: 'complete your payment below.',
      sepaTitle: 'SEPA Direct Debit (EU only)',
      sepaDescription: 'SEPA Direct Debit is available for EUR payments in the SEPA zone. Your bank account will be debited after order confirmation.',
      sepaInfo: {
        title: 'SEPA Direct Debit Information:',
        debit: 'Your bank account will be debited within 2-3 business days',
        refund: 'You have the right to a refund within 8 weeks',
        authorization: 'By providing your IBAN, you authorize us to collect payments',
      },
      checkoutFailed: 'Checkout failed',
      somethingWrong: 'Something went wrong. Please try again.',
      discountApplied: 'Discount applied! You save {amount}',
      invalidDiscount: 'Invalid discount code',
      discountError: 'Error validating discount code',
      percentOff: '{percent}% off',
      amountOff: '{amount} off',
      vatIncluded: 'VAT ({rate}%) is included in the price for {country}',
      errors: {
        validEmail: 'Valid email required',
        required: 'Required',
        ageConfirmation: 'You must confirm you are 18 or older',
      },
    },

    // Reviews
    reviews: {
      title: 'Customer Reviews',
      customerReviews: 'Customer reviews',
      writeReview: 'Write a Review',
      rating: 'Rating',
      yourReview: 'Your Review',
      reviewTitle: 'Review Title',
      reviewText: 'Review Text',
      submitReview: 'Submit Review',
      verifiedPurchase: 'Verified Purchase',
      helpful: 'Helpful',
      notHelpful: 'Not Helpful',
      noReviews: 'No reviews yet',
      beFirst: 'Be the first to review this product',
      averageRating: 'Average Rating',
      basedOnReviews: 'Based on {count} reviews',
      pendingApproval: 'Your review is pending approval',
      purchasePrompt: 'Have you purchased this product? Check your order confirmation email for a link to leave a review.',
    },

    // Footer
    footer: {
      aboutUs: 'About Us',
      contactUs: 'Contact Us',
      shipping: 'Shipping',
      returns: 'Returns',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      impressum: 'Impressum',
      legal: 'Legal',
      followUs: 'Follow Us',
      newsletter: 'Newsletter',
      subscribeNewsletter: 'Subscribe to our newsletter',
      enterEmail: 'Enter your email',
      subscribe: 'Subscribe',
      allRightsReserved: 'All rights reserved',
    },

    // Age Verification
    ageGate: {
      title: 'Age Verification Required',
      subtitle: 'You must be 18 or older to enter',
      enterBirthDate: 'Enter Your Birth Date',
      day: 'Day',
      month: 'Month',
      year: 'Year',
      verify: 'Verify Age',
      privacyNote: 'We do not store your birth date',
      underAge: 'You must be 18 or older to access this site',
      invalidDate: 'Please enter a valid date',
    },

    // Cookie Consent
    cookies: {
      title: 'Cookie Consent',
      message: 'We use cookies to enhance your browsing experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize',
      necessary: 'Necessary',
      analytics: 'Analytics',
      marketing: 'Marketing',
      preferences: 'Preferences',
      savePreferences: 'Save Preferences',
      learnMore: 'Learn More',
    },

    // Errors
    errors: {
      generic: 'Something went wrong. Please try again.',
      network: 'Network error. Please check your connection.',
      notFound: 'Page not found',
      unauthorized: 'Unauthorized access',
      validation: 'Please check your input',
      outOfStock: 'This product is out of stock',
      paymentFailed: 'Payment failed. Please try again.',
    },

    // Success Messages
    success: {
      addedToCart: 'Added to cart',
      addedToCartWithQuantity: '{quantity} × {name} added to cart',
      orderPlaced: 'Order placed successfully',
      reviewSubmitted: 'Review submitted for approval',
      subscribed: 'Successfully subscribed',
      updated: 'Updated successfully',
    },
  },

  de: {
    // Common
    common: {
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      remove: 'Entfernen',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Zurück',
      submit: 'Absenden',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
    },

    // Header/Navigation
    nav: {
      allLighters: 'Alle Feuerzeuge',
      torch: 'Brenner',
      refillable: 'Nachfüllbar',
      electric: 'Elektrisch',
      lighterFuel: 'Feuerzeugbenzin',
      cart: 'Warenkorb',
      encryptedCheckout: 'VERSCHLÜSSELTE KASSE',
    },

    // Homepage
    home: {
      nowShipping: 'JETZT VERSANDBEREIT — SPEZIAL-EDC-FEUERZEUGE',
      heroTitle1: 'Gebaut zum',
      heroTitle2: 'Entzünden',
      heroTitle3: 'entwickelt für die Ewigkeit.',
      heroDescription: 'Maschinell gefertigte Brenner-, Elektro- und nachfüllbare Feuerzeuge für Menschen, die Werkzeuge tragen, keine Spielereien. Jede Einheit spezifiziert, getestet und garantiert.',
      shopLineup: 'Sortiment ansehen',
      torchLighters: 'Brenner-Feuerzeuge →',
      tlsEncrypted: 'TLS-verschlüsselte Kasse',
      noCardData: 'Keine Kartendaten gespeichert',
      bitcoinAccepted: 'Bitcoin akzeptiert',
      sepaAccepted: 'Bitcoin & SEPA akzeptiert',
      discreetPackaging: 'Diskrete Verpackung',
      catalogLabel: '01 / KATALOG',
      featuredLighters: 'Empfohlene Feuerzeuge',
      viewAll: 'Alle anzeigen →',
      noProducts: 'Noch keine Produkte. Fügen Sie welche über das Admin-Dashboard hinzu.',
      ageWarning: 'Muss 18+ sein zum Kauf. Feuerzeuge sind in einigen Regionen eingeschränkte Artikel — prüfen Sie lokale Vorschriften vor der Bestellung. Außerhalb der Reichweite von Kindern aufbewahren.',
      security: 'SICHERHEIT',
      brandName: 'STRIKE & CO.',
      brandTagline: 'Maschinell gefertigte Feuerzeuge für den täglichen Gebrauch. Nach Spezifikation gebaut, zum Leuchten gemacht.',
    },

    // Product
    product: {
      addToCart: 'In den Warenkorb',
      outOfStock: 'Nicht vorrätig',
      inStock: '{count} auf Lager',
      price: 'Preis',
      description: 'Beschreibung',
      features: 'Eigenschaften',
      specifications: 'Spezifikationen',
      reviews: 'Bewertungen',
      rating: 'Bewertung',
      bulkDiscount: 'MENGENRABATT',
      bulkPricing: 'Staffelpreise',
      buyXGetYOff: 'Ab {min} Stück {discount}% Rabatt',
      ageRestricted: 'Altersbeschränkt (18+)',
      category: 'Kategorie',
      sku: 'Artikelnummer',
      quantity: 'Menge',
      encryptedCheckout: 'Verschlüsselte Kasse, Karte oder Bitcoin',
      ageRestriction: 'Muss 18+ sein zum Kauf',
      relatedProducts: 'Ähnliche Produkte',
      onlyXLeft: 'NUR NOCH {count} VERFÜGBAR',
    },

    // Products Listing
    products: {
      catalog: 'KATALOG',
      allLighters: 'Alle Feuerzeuge',
      all: 'Alle',
      noProducts: 'Keine Produkte in dieser Kategorie gefunden.',
    },

    // Cart
    cart: {
      title: 'Ihr Warenkorb',
      empty: 'Ihr Warenkorb ist leer',
      emptyDescription: 'Noch nichts hier. Finden Sie etwas Lohnenswertes.',
      browseLighters: 'Feuerzeuge durchsuchen',
      subtotal: 'Zwischensumme',
      discount: 'Rabatt',
      total: 'Gesamt',
      proceedToCheckout: 'Zur Kasse gehen',
      continueShopping: 'Weiter einkaufen',
      quantity: 'Menge',
      remove: 'Entfernen',
      bulkSavings: 'Mengenrabatt',
      youSave: 'Sie sparen',
      appliedDiscount: '{discount}% Mengenrabatt angewendet',
      bulkDiscountApplied: 'Mengenrabatt angewendet!',
      savingAmount: 'Sie sparen {amount} mit Staffelpreisen',
      bulkDiscountSavings: 'Mengenrabatt-Ersparnis',
      off: 'Rabatt',
      checkoutNote: 'Staffelpreise werden automatisch angewendet. Versand und Steuern werden an der Kasse berechnet.',
      decreaseQuantity: 'Menge verringern',
      increaseQuantity: 'Menge erhöhen',
      removeItem: '{name} entfernen',
    },

    // Checkout
    checkout: {
      title: 'Kasse',
      contact: 'Kontakt',
      shippingAddress: 'Lieferadresse',
      paymentMethod: 'Zahlungsmethode',
      orderSummary: 'Bestellübersicht',
      placeOrder: 'Bestellung aufgeben',
      processing: 'Wird verarbeitet...',
      fullName: 'Vollständiger Name',
      email: 'E-Mail',
      addressLine1: 'Adresszeile 1',
      addressLine2: 'Adresszeile 2 (optional)',
      city: 'Stadt',
      state: 'Bundesland / Provinz',
      postalCode: 'Postleitzahl',
      country: 'Land',
      ageVerification: 'Altersverifikation',
      ageConfirmation: 'Ich bestätige, dass ich 18 Jahre oder älter bin und rechtlich berechtigt bin, Feuerzeuge in meiner Gerichtsbarkeit zu kaufen.',
      confirmAge: 'Ich bestätige, dass ich 18 Jahre oder älter bin',
      card: 'Karte',
      cryptocurrency: 'Kryptowährung',
      sepa: 'SEPA-Lastschrift',
      subtotal: 'Zwischensumme',
      total: 'Gesamt',
      discount: 'Rabatt',
      netAmount: 'Nettobetrag',
      vat: 'MwSt.',
      promoCode: 'Aktionscode',
      enterPromoCode: 'Aktionscode eingeben',
      apply: 'Anwenden',
      secureCheckout: 'Sichere, verschlüsselte Kasse',
      securePayment: 'Ihre Zahlungsdetails sind verschlüsselt und berühren niemals unsere Server.',
      continueToPayment: 'Weiter zur Zahlung',
      continueToBitcoin: 'Weiter zur Bitcoin-Zahlung',
      continueToSepa: 'Weiter zur SEPA-Zahlung',
      addBeforeCheckout: 'Fügen Sie etwas hinzu, bevor Sie zur Kasse gehen.',
      payment: 'Zahlung',
      sepaDirectDebit: 'SEPA-Lastschrift',
      orderNumber: 'Bestellung',
      completePayment: 'schließen Sie Ihre Zahlung unten ab.',
      sepaTitle: 'SEPA-Lastschrift (nur EU)',
      sepaDescription: 'SEPA-Lastschrift ist für EUR-Zahlungen in der SEPA-Zone verfügbar. Ihr Bankkonto wird nach Bestellbestätigung belastet.',
      sepaInfo: {
        title: 'SEPA-Lastschrift Informationen:',
        debit: 'Ihr Bankkonto wird innerhalb von 2-3 Werktagen belastet',
        refund: 'Sie haben das Recht auf eine Rückerstattung innerhalb von 8 Wochen',
        authorization: 'Durch Angabe Ihrer IBAN autorisieren Sie uns, Zahlungen einzuziehen',
      },
      checkoutFailed: 'Kasse fehlgeschlagen',
      somethingWrong: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
      discountApplied: 'Rabatt angewendet! Sie sparen {amount}',
      invalidDiscount: 'Ungültiger Rabattcode',
      discountError: 'Fehler beim Validieren des Rabattcodes',
      percentOff: '{percent}% Rabatt',
      amountOff: '{amount} Rabatt',
      vatIncluded: 'MwSt. ({rate}%) ist im Preis für {country} enthalten',
      errors: {
        validEmail: 'Gültige E-Mail erforderlich',
        required: 'Erforderlich',
        ageConfirmation: 'Sie müssen bestätigen, dass Sie 18 Jahre oder älter sind',
      },
    },

    // Reviews
    reviews: {
      title: 'Kundenbewertungen',
      customerReviews: 'Kundenbewertungen',
      writeReview: 'Bewertung schreiben',
      rating: 'Bewertung',
      yourReview: 'Ihre Bewertung',
      reviewTitle: 'Titel der Bewertung',
      reviewText: 'Bewertungstext',
      submitReview: 'Bewertung absenden',
      verifiedPurchase: 'Verifizierter Kauf',
      helpful: 'Hilfreich',
      notHelpful: 'Nicht hilfreich',
      noReviews: 'Noch keine Bewertungen',
      beFirst: 'Seien Sie der Erste, der dieses Produkt bewertet',
      averageRating: 'Durchschnittliche Bewertung',
      basedOnReviews: 'Basierend auf {count} Bewertungen',
      pendingApproval: 'Ihre Bewertung wartet auf Freigabe',
      purchasePrompt: 'Haben Sie dieses Produkt gekauft? Überprüfen Sie Ihre Bestellbestätigungs-E-Mail für einen Link, um eine Bewertung abzugeben.',
    },

    // Footer
    footer: {
      aboutUs: 'Über uns',
      contactUs: 'Kontakt',
      shipping: 'Versand',
      returns: 'Rücksendungen',
      privacy: 'Datenschutzerklärung',
      terms: 'AGB',
      impressum: 'Impressum',
      legal: 'Rechtliches',
      followUs: 'Folgen Sie uns',
      newsletter: 'Newsletter',
      subscribeNewsletter: 'Abonnieren Sie unseren Newsletter',
      enterEmail: 'E-Mail eingeben',
      subscribe: 'Abonnieren',
      allRightsReserved: 'Alle Rechte vorbehalten',
    },

    // Age Verification
    ageGate: {
      title: 'Altersverifikation erforderlich',
      subtitle: 'Sie müssen 18 Jahre oder älter sein',
      enterBirthDate: 'Geben Sie Ihr Geburtsdatum ein',
      day: 'Tag',
      month: 'Monat',
      year: 'Jahr',
      verify: 'Alter bestätigen',
      privacyNote: 'Wir speichern Ihr Geburtsdatum nicht',
      underAge: 'Sie müssen 18 Jahre oder älter sein, um diese Seite zu besuchen',
      invalidDate: 'Bitte geben Sie ein gültiges Datum ein',
    },

    // Cookie Consent
    cookies: {
      title: 'Cookie-Einwilligung',
      message: 'Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern und unseren Traffic zu analysieren. Durch Klicken auf "Alle akzeptieren" stimmen Sie der Verwendung von Cookies zu.',
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      customize: 'Anpassen',
      necessary: 'Notwendig',
      analytics: 'Analytik',
      marketing: 'Marketing',
      preferences: 'Einstellungen',
      savePreferences: 'Einstellungen speichern',
      learnMore: 'Mehr erfahren',
    },

    // Errors
    errors: {
      generic: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
      network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
      notFound: 'Seite nicht gefunden',
      unauthorized: 'Unbefugter Zugriff',
      validation: 'Bitte überprüfen Sie Ihre Eingabe',
      outOfStock: 'Dieses Produkt ist nicht vorrätig',
      paymentFailed: 'Zahlung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    },

    // Success Messages
    success: {
      addedToCart: 'Zum Warenkorb hinzugefügt',
      addedToCartWithQuantity: '{quantity} × {name} zum Warenkorb hinzugefügt',
      orderPlaced: 'Bestellung erfolgreich aufgegeben',
      reviewSubmitted: 'Bewertung zur Freigabe eingereicht',
      subscribed: 'Erfolgreich abonniert',
      updated: 'Erfolgreich aktualisiert',
    },
  },
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'common.loading')
 * @param {string} locale - Locale code (en or de)
 * @param {object} params - Parameters for interpolation
 * @returns {string} Translated string
 */
export function t(key, locale = 'en', params = {}) {
  const keys = key.split('.');
  let value = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      // Fallback to English if translation not found
      value = translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object') {
          value = value[fallbackKey];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Replace parameters in the string
  let result = value;
  for (const [param, paramValue] of Object.entries(params)) {
    result = result.replace(`{${param}}`, paramValue);
  }

  return result;
}

/**
 * Get all translations for a namespace
 * @param {string} namespace - Namespace (e.g., 'common', 'product')
 * @param {string} locale - Locale code
 * @returns {object} Translations object
 */
export function getNamespace(namespace, locale = 'en') {
  return translations[locale]?.[namespace] || translations.en[namespace] || {};
}

/**
 * Get supported locales
 * @returns {Array} Array of locale codes
 */
export function getSupportedLocales() {
  return Object.keys(translations);
}

/**
 * Check if locale is supported
 * @param {string} locale - Locale code
 * @returns {boolean} True if supported
 */
export function isLocaleSupported(locale) {
  return translations[locale] !== undefined;
}

