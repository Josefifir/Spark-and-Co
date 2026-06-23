# German/EU Compliance Implementation Guide

## Overview

This document outlines the complete implementation of German and EU compliance features for the e-commerce platform, including GDPR compliance, VAT handling, legal pages, multi-currency support, and German localization.

---

## ✅ Completed Features

### 1. Cookie Consent System (GDPR Compliant)
- **Component**: `components/shop/CookieConsent.jsx`
- **Model**: `lib/models/CookieConsent.js`
- **API**: `app/api/cookie-consent/route.js`
- **Features**:
  - Granular consent categories (necessary, analytics, marketing, preferences)
  - Customizable settings modal
  - Consent logging for GDPR compliance
  - Version tracking for policy updates

### 2. VAT Calculation System
- **Utility**: `lib/utils-vat.js`
- **Features**:
  - VAT rates for all EU countries
  - Net/gross price calculations
  - VAT-inclusive pricing display
  - B2B reverse charge support
  - VAT ID validation

### 3. Enhanced Age Verification
- **Component**: `components/shop/AgeVerificationStrict.jsx`
- **Features**:
  - Birth date entry (DD/MM/YYYY)
  - Age calculation and validation
  - Privacy-preserving (doesn't store birth date)
  - Session and persistent verification

### 4. Privacy Policy Page
- **Page**: `app/(shop)/legal/privacy/page.jsx`
- **Compliance**: Full GDPR compliance with all required sections

---

## 📋 Remaining Implementation Tasks

### Phase 1: Legal Pages

#### 1.1 Terms & Conditions Page
**File**: `app/(shop)/legal/terms/page.jsx`

**Required Sections**:
- General terms of use
- Product descriptions and availability
- Pricing and payment terms
- Shipping and delivery
- Returns and refunds (Widerrufsrecht - 14-day right of withdrawal)
- Liability limitations
- Dispute resolution
- Applicable law (German law)

#### 1.2 Impressum (Imprint) Page
**File**: `app/(shop)/legal/impressum/page.jsx`

**Required Information** (§5 TMG - German Telemedia Act):
- Company name and legal form
- Full address
- Contact details (phone, email)
- Commercial register number
- VAT identification number
- Responsible person (Verantwortlicher)
- Professional liability insurance (if applicable)
- Dispute resolution platform link

**Template**:
```jsx
export default function ImpressumPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1>Impressum</h1>
      
      <h2>Angaben gemäß § 5 TMG</h2>
      <p>
        [Company Name]<br />
        [Legal Form]<br />
        [Street Address]<br />
        [Postal Code] [City]<br />
        Deutschland
      </p>
      
      <h2>Kontakt</h2>
      <p>
        Telefon: +49 (0) XXX XXXXXXX<br />
        E-Mail: info@example.com
      </p>
      
      <h2>Umsatzsteuer-ID</h2>
      <p>
        Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
        DE XXX XXX XXX
      </p>
      
      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
        <a href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</a>
      </p>
    </div>
  );
}
```

---

### Phase 2: Multi-Currency Support (EUR)

#### 2.1 Currency Context
**File**: `lib/contexts/CurrencyContext.jsx`

```jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext(null);

const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92, // Update with real-time rates
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("EUR");
  const [rates, setRates] = useState(EXCHANGE_RATES);

  // Detect user's location and set default currency
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        
        if (data.country_code === "US") {
          setCurrency("USD");
        } else if (data.continent_code === "EU") {
          setCurrency("EUR");
        }
      } catch (error) {
        // Default to EUR for EU-based shop
        setCurrency("EUR");
      }
    };
    
    detectCurrency();
  }, []);

  const convertPrice = (priceInCents, fromCurrency = "USD") => {
    const priceInUSD = priceInCents / 100;
    const rate = rates[currency] / rates[fromCurrency];
    return Math.round(priceInUSD * rate * 100);
  };

  const formatPrice = (priceCents) => {
    const formatter = new Intl.NumberFormat(
      currency === "EUR" ? "de-DE" : "en-US",
      {
        style: "currency",
        currency: currency,
      }
    );
    return formatter.format(priceCents / 100);
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, convertPrice, formatPrice, rates }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
```

#### 2.2 Update Product Model
**File**: `lib/models/Product.js`

Add EUR pricing support:
```javascript
{
  priceCents: { type: Number, required: true }, // USD base price
  priceEurCents: { type: Number }, // EUR price (optional, calculated if not set)
  currency: { type: String, default: "usd" },
}
```

#### 2.3 Update Stripe Integration
**File**: `lib/payments/stripe.js`

Add EUR support:
```javascript
export async function createPaymentIntent(amountCents, currency = "usd", metadata = {}) {
  return await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}
```

---

### Phase 3: SEPA Payment Method

#### 3.1 Update Stripe Payment Form
**File**: `components/shop/StripePaymentForm.jsx`

Add SEPA Direct Debit option:
```jsx
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function StripePaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card", "sepa_debit"], // Show SEPA option
        }}
      />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
}
```

#### 3.2 Update Checkout API
**File**: `app/api/checkout/route.js`

Enable SEPA in payment intent:
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalCents,
  currency: currency.toLowerCase(),
  payment_method_types: ["card", "sepa_debit"], // Enable SEPA
  metadata: { orderNumber },
});
```

---

### Phase 4: German Language Support

#### 4.1 Translation System
**File**: `lib/i18n/translations.js`

```javascript
export const translations = {
  en: {
    common: {
      addToCart: "Add to Cart",
      checkout: "Checkout",
      total: "Total",
      subtotal: "Subtotal",
      shipping: "Shipping",
      vat: "VAT",
    },
    product: {
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      bulkDiscount: "Buy {quantity}+ get {percent}% off",
    },
    legal: {
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      imprint: "Imprint",
    },
  },
  de: {
    common: {
      addToCart: "In den Warenkorb",
      checkout: "Zur Kasse",
      total: "Gesamt",
      subtotal: "Zwischensumme",
      shipping: "Versand",
      vat: "MwSt.",
    },
    product: {
      inStock: "Auf Lager",
      outOfStock: "Nicht verfügbar",
      bulkDiscount: "Ab {quantity} Stück {percent}% Rabatt",
    },
    legal: {
      privacy: "Datenschutzerklärung",
      terms: "AGB",
      imprint: "Impressum",
    },
  },
};

export function t(key, locale = "en", params = {}) {
  const keys = key.split(".");
  let value = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (!value) return key;
  
  // Replace parameters
  return Object.entries(params).reduce(
    (str, [param, val]) => str.replace(`{${param}}`, val),
    value
  );
}
```

#### 4.2 Locale Context
**File**: `lib/contexts/LocaleContext.jsx`

```jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { translations, t as translate } from "@/lib/i18n/translations";

const LocaleContext = createContext(null);

export function LocaleProvider({ children, defaultLocale = "en" }) {
  const [locale, setLocale] = useState(defaultLocale);

  const t = (key, params) => translate(key, locale, params);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
```

#### 4.3 German Route Group
**File**: `app/[locale]/(shop)/layout.jsx`

```jsx
import { LocaleProvider } from "@/lib/contexts/LocaleContext";

export default function LocaleLayout({ children, params }) {
  const locale = params.locale || "en";
  
  return (
    <LocaleProvider defaultLocale={locale}>
      {children}
    </LocaleProvider>
  );
}
```

---

### Phase 5: VAT Integration in Checkout

#### 5.1 Update Checkout Page
**File**: `app/(shop)/checkout/page.jsx`

Add VAT breakdown display:
```jsx
import { calculateOrderVAT, formatVATBreakdown } from "@/lib/utils-vat";

export default function CheckoutPage() {
  const [country, setCountry] = useState("DE");
  const { subtotalCents } = useCart();
  
  const vatBreakdown = calculateOrderVAT(subtotalCents, country, true);
  const formatted = formatVATBreakdown(vatBreakdown, "EUR");

  return (
    <div>
      {/* Order Summary */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal (net)</span>
          <span>{formatted.netAmount}</span>
        </div>
        <div className="flex justify-between text-sm text-paper-dim">
          <span>{formatted.vatLabel}</span>
          <span>{formatted.vatAmount}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-2">
          <span>Total</span>
          <span>{formatted.grossAmount}</span>
        </div>
      </div>
    </div>
  );
}
```

#### 5.2 Update Checkout API
**File**: `app/api/checkout/route.js`

Add VAT calculation:
```javascript
import { calculateOrderVAT } from "@/lib/utils-vat";

// In checkout route
const country = body.shippingAddress.country;
const vatBreakdown = calculateOrderVAT(subtotalCents, country, true);

const order = await Order.create({
  // ... existing fields
  vatRate: vatBreakdown.vatRate,
  vatAmountCents: vatBreakdown.vatAmount,
  netAmountCents: vatBreakdown.netAmount,
  totalCents: vatBreakdown.grossAmount,
  currency: currency,
});
```

---

### Phase 6: Update Order Model

**File**: `lib/models/Order.js`

Add VAT fields:
```javascript
{
  // ... existing fields
  currency: { type: String, default: "usd" },
  vatRate: { type: Number, default: 0 },
  vatAmountCents: { type: Number, default: 0 },
  netAmountCents: { type: Number },
  // totalCents remains as gross amount
}
```

---

### Phase 7: Update Footer with Legal Links

**File**: `components/shop/Footer.jsx`

```jsx
export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-panel mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-display font-bold text-paper mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-paper-dim">
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-paper mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-paper-dim">
              <li><a href="/legal/impressum">Impressum</a></li>
              <li><a href="/legal/privacy">Privacy Policy</a></li>
              <li><a href="/legal/terms">Terms & Conditions</a></li>
              <li><a href="/legal/widerruf">Widerrufsbelehrung</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-display font-bold text-paper mb-4">Service</h3>
            <ul className="space-y-2 text-sm text-paper-dim">
              <li><a href="/shipping">Shipping Info</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="/faq">FAQ</a></li>
            </ul>
          </div>

          {/* Language & Currency */}
          <div>
            <h3 className="font-display font-bold text-paper mb-4">Settings</h3>
            <div className="space-y-2">
              <select className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <select className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper">
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-hairline mt-8 pt-8 text-center text-sm text-steel">
          <p>© {new Date().getFullYear()} Lighter Shop. All rights reserved.</p>
          <p className="mt-2">
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="hover:text-flame">
              EU Online Dispute Resolution
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

---

### Phase 8: Update Shop Layout

**File**: `app/(shop)/layout.jsx`

Add Cookie Consent and contexts:
```jsx
import CookieConsent from "@/components/shop/CookieConsent";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { LocaleProvider } from "@/lib/contexts/LocaleContext";

export default function ShopLayout({ children }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <CookieConsent />
        </CartProvider>
      </CurrencyProvider>
    </LocaleProvider>
  );
}
```

---

## Testing Checklist

### GDPR Compliance
- [ ] Cookie consent banner appears on first visit
- [ ] Cookie preferences are saved and respected
- [ ] Consent can be withdrawn
- [ ] Privacy policy is accessible
- [ ] Data subject rights are documented

### VAT Handling
- [ ] VAT is calculated correctly for EU countries
- [ ] VAT-inclusive prices are displayed
- [ ] VAT breakdown shows in checkout
- [ ] Non-EU orders have no VAT
- [ ] B2B reverse charge works (if implemented)

### Age Verification
- [ ] Birth date entry is required
- [ ] Age calculation is accurate
- [ ] Under-18 users are blocked
- [ ] Verification persists across sessions
- [ ] Birth date is not stored

### Multi-Currency
- [ ] EUR prices display correctly
- [ ] Currency can be switched
- [ ] Stripe accepts EUR payments
- [ ] Exchange rates are up-to-date

### SEPA Payments
- [ ] SEPA option appears for EUR
- [ ] SEPA payments process correctly
- [ ] Mandate text is displayed
- [ ] Payment confirmation works

### German Localization
- [ ] German language option works
- [ ] All UI text is translated
- [ ] Legal pages are in German
- [ ] Date/number formats are correct

### Legal Pages
- [ ] Impressum has all required info
- [ ] Privacy policy is GDPR-compliant
- [ ] Terms include Widerrufsrecht
- [ ] All pages are accessible from footer

---

## Deployment Checklist

### Environment Variables
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Currency
DEFAULT_CURRENCY=EUR
EXCHANGE_RATE_API_KEY=...

# Company Info
COMPANY_NAME="Your Company Name"
COMPANY_ADDRESS="Street, City, Country"
COMPANY_VAT_ID="DE123456789"
COMPANY_EMAIL="info@example.com"
COMPANY_PHONE="+49 (0) XXX XXXXXXX"

# Legal
PRIVACY_EMAIL="privacy@example.com"
DPO_EMAIL="dpo@example.com"
```

### Legal Requirements
- [ ] Register with data protection authority
- [ ] Obtain VAT ID number
- [ ] Register business (Handelsregister)
- [ ] Set up professional liability insurance
- [ ] Create data processing agreements with vendors
- [ ] Implement GDPR-compliant data retention policies

### Technical Requirements
- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Cookie consent implemented
- [ ] Data backup system in place
- [ ] Incident response plan documented

---

## Support & Resources

### German Legal Resources
- **Impressum Generator**: https://www.e-recht24.de/impressum-generator.html
- **Privacy Policy Generator**: https://www.e-recht24.de/muster-datenschutzerklaerung.html
- **GDPR Compliance**: https://www.bfdi.bund.de/
- **EU VAT Rates**: https://ec.europa.eu/taxation_customs/tedb/taxSearch.html
- **VIES VAT Validation**: https://ec.europa.eu/taxation_customs/vies/

### Stripe Documentation
- **SEPA Direct Debit**: https://stripe.com/docs/payments/sepa-debit
- **Multi-Currency**: https://stripe.com/docs/currencies
- **Payment Methods**: https://stripe.com/docs/payments/payment-methods

---

## Version History

- **v1.0** (2026-06-23): Initial implementation guide
- Cookie consent system
- VAT calculation utilities
- Enhanced age verification
- Privacy policy page

---

**Next Steps**: Implement remaining legal pages, integrate multi-currency support, add SEPA payments, and complete German localization.