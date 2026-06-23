# Translation & Currency Implementation Status

## ✅ What's Been Implemented

### 1. Translation System Infrastructure
- ✅ Complete translation dictionary (`lib/i18n/translations.js`) - 398 lines
- ✅ English and German translations for all UI elements
- ✅ React Context for locale management (`lib/i18n/LocaleContext.jsx`)
- ✅ `useLocale()` hook for components
- ✅ Language switcher component in header
- ✅ LocaleProvider wrapping the shop layout

### 2. Currency System Infrastructure
- ✅ Currency utilities (server & client)
- ✅ USD and EUR support
- ✅ Currency switcher component in header
- ✅ Automatic currency detection by country
- ✅ Stripe integration for EUR payments
- ✅ Checkout API converts prices to EUR for Eurozone

### 3. Components Using Translations
- ✅ Header navigation
- ✅ Footer links and text
- ✅ Language switcher
- ✅ Currency switcher

## ❌ What Still Needs Translation

### Pages That Need Translation:
1. **Home Page** (`app/(shop)/page.jsx`)
   - Hero text
   - Featured products section
   - Call-to-action buttons

2. **Products Page** (`app/(shop)/products/page.jsx`)
   - Page title
   - Filter labels
   - Sort options
   - "No products found" message

3. **Product Detail Page** (`app/(shop)/products/[slug]/page.jsx`)
   - "Add to Cart" button
   - "Out of Stock" message
   - Product details labels
   - Review section

4. **Cart Page** (`app/(shop)/cart/page.jsx`)
   - "Shopping Cart" title
   - "Your cart is empty" message
   - "Subtotal", "Total" labels
   - "Proceed to Checkout" button
   - Bulk discount messages

5. **Checkout Page** (`app/(shop)/checkout/page.jsx`)
   - Form labels (Email, Name, Address, etc.)
   - Payment method labels
   - "Place Order" button
   - Validation error messages
   - SEPA information text

6. **Success Page** (`app/(shop)/checkout/success/page.jsx`)
   - Success message
   - Order confirmation text

### Components That Need Translation:
1. **ProductCard** (`components/shop/ProductCard.jsx`)
   - "Add to Cart" button
   - "Out of Stock" badge
   - Bulk discount text

2. **ReviewForm** (`components/shop/ReviewForm.jsx`)
   - Form labels
   - Submit button
   - Validation messages

3. **ReviewList** (`components/shop/ReviewList.jsx`)
   - "No reviews yet" message
   - "Verified Purchase" badge
   - "Helpful" button

4. **AgeGate** (`components/shop/AgeGate.jsx`)
   - Age verification message
   - Confirm button

5. **CookieConsent** (`components/shop/CookieConsent.jsx`)
   - Already has some translations but needs full integration

## ❌ What Still Needs Currency Conversion

### Price Display Issues:
Currently, prices are only converted at checkout. Product pages and cart still show USD prices even when EUR is selected.

### What Needs to Be Done:

1. **Product Listing API** (`app/api/products/route.js`)
   - Accept currency parameter
   - Convert prices before returning
   - Or return both USD and EUR prices

2. **Product Detail API** (`app/api/products/[slug]/route.js`)
   - Convert product price based on currency
   - Convert bulk pricing tiers

3. **Cart Display** (`app/(shop)/cart/page.jsx`)
   - Get user's selected currency
   - Convert all prices for display
   - Show correct currency symbol

4. **Product Cards** (`components/shop/ProductCard.jsx`)
   - Get user's selected currency
   - Convert price for display
   - Show correct currency symbol

### Two Approaches:

**Approach A: Server-Side Conversion (Recommended)**
```javascript
// In API routes
import { getPreferredCurrency, convertPrice } from '@/lib/utils-currency';

export async function GET(request) {
  const currency = request.cookies.get('preferred_currency')?.value || 'USD';
  const products = await Product.find({});
  
  // Convert prices
  const convertedProducts = products.map(p => ({
    ...p.toObject(),
    priceCents: currency === 'USD' ? p.priceCents : convertPrice(p.priceCents, 'USD', currency),
    currency: currency
  }));
  
  return NextResponse.json({ products: convertedProducts });
}
```

**Approach B: Client-Side Conversion (Simpler but less accurate)**
```javascript
// In components
import { getPreferredCurrency, convertPrice, formatPrice } from '@/lib/utils-currency-client';

function ProductCard({ product }) {
  const currency = getPreferredCurrency();
  const convertedPrice = currency === 'USD' 
    ? product.priceCents 
    : convertPrice(product.priceCents, 'USD', currency);
  
  return <div>{formatPrice(convertedPrice, currency)}</div>;
}
```

## 📋 Step-by-Step Implementation Guide

### Phase 1: Add Translations to Pages (Estimated: 2-3 hours)

1. **Update Cart Page:**
```javascript
// app/(shop)/cart/page.jsx
import { useLocale } from '@/lib/i18n/LocaleContext';

export default function CartPage() {
  const { t } = useLocale();
  
  return (
    <h1>{t('cart.title')}</h1>
    // Replace all hardcoded text with t('key')
  );
}
```

2. **Update Checkout Page:**
```javascript
// app/(shop)/checkout/page.jsx
import { useLocale } from '@/lib/i18n/LocaleContext';

export default function CheckoutPage() {
  const { t } = useLocale();
  
  return (
    <Input label={t('checkout.email')} />
    // Replace all labels and text
  );
}
```

3. **Update Product Pages:**
   - Products listing page
   - Product detail page
   - Add translation keys for all text

4. **Update Components:**
   - ProductCard
   - ReviewForm
   - ReviewList
   - AgeGate

### Phase 2: Implement Currency Conversion (Estimated: 3-4 hours)

1. **Create Currency Context (Alternative to page reload):**
```javascript
// lib/currency/CurrencyContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getPreferredCurrency, setPreferredCurrency } from '@/lib/utils-currency-client';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');
  
  useEffect(() => {
    setCurrency(getPreferredCurrency());
  }, []);
  
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    setPreferredCurrency(newCurrency);
  };
  
  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
```

2. **Update Product Display Components:**
```javascript
// components/shop/ProductCard.jsx
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { convertPrice, formatPrice } from '@/lib/utils-currency-client';

export default function ProductCard({ product }) {
  const { currency } = useCurrency();
  
  const displayPrice = currency === 'USD' 
    ? product.priceCents 
    : convertPrice(product.priceCents, 'USD', currency);
  
  return (
    <div>
      <p>{formatPrice(displayPrice, currency)}</p>
    </div>
  );
}
```

3. **Update Cart Page:**
   - Convert all prices based on selected currency
   - Update subtotal and total calculations
   - Show correct currency symbol

4. **Update Currency Switcher:**
   - Remove page reload
   - Use context to update currency
   - Prices update instantly

### Phase 3: Testing (Estimated: 1-2 hours)

1. **Translation Testing:**
   - Switch to German
   - Navigate through all pages
   - Verify all text translates
   - Check for missing translations

2. **Currency Testing:**
   - Switch to EUR
   - Check product prices convert
   - Verify cart calculations
   - Test checkout with EUR
   - Confirm Stripe receives correct currency

3. **Integration Testing:**
   - Test language + currency together
   - Verify persistence across page reloads
   - Check mobile responsiveness
   - Test all payment methods

## 🎯 Quick Win: Minimum Viable Implementation

If you want to get something working quickly:

### 1. Add Translations to Cart & Checkout Only (30 minutes)
These are the most important pages for conversion.

### 2. Add Client-Side Currency Conversion to ProductCard (30 minutes)
This will make prices show in EUR throughout the site.

### 3. Test the Critical Path (15 minutes)
Browse → Add to Cart → Checkout → Pay

## 📝 Current Status Summary

**Translation System:** ✅ 100% Infrastructure Ready, ❌ 20% Implementation
- System is built and working
- Only header and footer use it
- Need to add to all pages and components

**Currency System:** ✅ 100% Infrastructure Ready, ❌ 30% Implementation  
- System is built and working
- Checkout converts to EUR correctly
- Product pages still show USD only
- Need client-side or server-side conversion

**Estimated Time to Complete:**
- Full translation implementation: 2-3 hours
- Full currency conversion: 3-4 hours
- Testing and fixes: 1-2 hours
- **Total: 6-9 hours of development work**

## 🚀 Recommendation

Focus on the "Quick Win" approach first to get a working demo, then gradually add translations to other pages as needed. The infrastructure is solid - it's just a matter of applying it throughout the codebase.