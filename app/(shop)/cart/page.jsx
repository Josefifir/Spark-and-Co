"use client";

import Link from "next/link";
import { Minus, Plus, X, Flame, TrendingDown } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { calculateBulkPrice } from "@/lib/utils-pricing-client";
import Button from "@/components/ui/Button";
import CartUpsell from "@/components/shop/CartUpsell";
import { useEffect, useState, useRef, useMemo } from "react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalCents, hydrated } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  // productMeta: { [productId]: { bulkPricingTiers, stock } } — fetched once on mount
  const [productMeta, setProductMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  // stockErrors: { [productId]: string | null }
  const [stockErrors, setStockErrors] = useState({});

  // Fetch product meta once when the cart is hydrated
  useEffect(() => {
    if (!hydrated) return;
    if (fetchedRef.current) { setLoading(false); return; }
    fetchedRef.current = true;

    if (items.length === 0) { setLoading(false); return; }

    fetch('/api/products')
      .then(r => r.json())
      .then(data => {
        const meta = {};
        for (const p of data.products || []) {
          meta[p._id] = { bulkPricingTiers: p.bulkPricingTiers || [], stock: p.stock ?? 50 };
        }
        setProductMeta(meta);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hydrated]); // ← only depends on hydrated, NOT items

  // Derive enriched items purely in-memory — instant, no API call
  const itemsWithBulkPricing = useMemo(() => items.map(item => {
    const meta  = productMeta[item.productId] || { bulkPricingTiers: [], stock: 50 };
    const bulkPrice = calculateBulkPrice(item.priceCents, item.quantity, meta.bulkPricingTiers);
    return { ...item, bulkPricingTiers: meta.bulkPricingTiers, stock: meta.stock, bulkPrice };
  }), [items, productMeta]);

  if (!hydrated || loading) {
    return <div className="max-w-4xl mx-auto px-6 py-16" />;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <Flame className="w-12 h-12 text-steel/30 mx-auto mb-6" />
        <h1 className="font-display text-2xl text-paper mb-3">{t('cart.empty')}</h1>
        <p className="text-paper-dim mb-8">{t('cart.emptyDescription')}</p>
        <Link href="/products">
          <Button>{t('cart.browseLighters')}</Button>
        </Link>
      </div>
    );
  }

  const totalSavings = itemsWithBulkPricing.reduce((sum, item) => {
    if (item.bulkPrice?.bulkApplied) {
      const originalPrice = item.priceCents * item.quantity;
      const discountedPrice = item.bulkPrice.totalPriceCents;
      return sum + (originalPrice - discountedPrice);
    }
    return sum;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-paper mb-6 sm:mb-10">{t('cart.title')}</h1>

      {totalSavings > 0 && (
        <div className="bg-flame/10 border border-flame/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-flame shrink-0" />
          <div>
            <p className="text-paper font-medium">{t('cart.bulkDiscountApplied')}</p>
            <p className="text-sm text-paper-dim">
              {t('cart.savingAmount', { amount: formatPrice(totalSavings) })}
            </p>
          </div>
        </div>
      )}

      <div className="border border-hairline rounded-sm divide-y divide-hairline mb-8">
        {itemsWithBulkPricing.map((item) => (
          <div key={item.productId} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
            {/* Thumbnail */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-panel-raised rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Flame className="w-6 h-6 text-steel/40" />
              )}
            </div>

            {/* Name + price — grows to fill space */}
            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.slug}`} className="font-medium text-paper hover:text-flame transition-colors block truncate text-sm sm:text-base">
                {item.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono-tech text-xs sm:text-sm text-paper-dim">
                  {formatPrice(item.bulkPrice?.unitPriceCents || item.priceCents, 'USD')}
                </span>
                {item.bulkPrice?.bulkApplied && (
                  <span className="text-xs text-flame font-mono-tech">
                    ({item.bulkPrice.discountPercent}% {t('cart.off')})
                  </span>
                )}
              </div>

              {/* On mobile: quantity stepper sits below the name */}
              <div className="flex flex-col gap-1 mt-2 sm:hidden">
                <div className="flex items-center gap-2">
                  <div className={`flex items-center rounded-sm border ${stockErrors[item.productId] ? 'border-danger' : 'border-hairline'}`}>
                    <button
                      onClick={() => { updateQuantity(item.productId, item.quantity - 1); setStockErrors(e => ({ ...e, [item.productId]: null })); }}
                      className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                      aria-label={t('cart.decreaseQuantity')}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (isNaN(v) || v < 1) return;
                        if (v > item.stock) {
                          setStockErrors(err => ({ ...err, [item.productId]: `Only ${item.stock} in stock` }));
                        } else {
                          setStockErrors(err => ({ ...err, [item.productId]: null }));
                          updateQuantity(item.productId, v);
                        }
                      }}
                      className="w-10 text-center font-mono-tech text-sm text-paper bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Quantity"
                    />
                    <button
                      onClick={() => {
                        if (item.quantity >= item.stock) {
                          setStockErrors(err => ({ ...err, [item.productId]: `Only ${item.stock} in stock` }));
                        } else {
                          updateQuantity(item.productId, item.quantity + 1);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                      aria-label={t('cart.increaseQuantity')}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-mono-tech text-sm text-paper ml-auto">
                    {formatPrice(item.bulkPrice?.totalPriceCents || (item.priceCents * item.quantity), 'USD')}
                  </span>
                </div>
                {stockErrors[item.productId] && (
                  <p className="text-xs text-danger font-mono-tech">{stockErrors[item.productId]}</p>
                )}
              </div>
            </div>

            {/* Desktop: quantity stepper + error */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className={`flex items-center rounded-sm border ${stockErrors[item.productId] ? 'border-danger' : 'border-hairline'}`}>
                <button
                  onClick={() => { updateQuantity(item.productId, item.quantity - 1); setStockErrors(e => ({ ...e, [item.productId]: null })); }}
                  className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                  aria-label={t('cart.decreaseQuantity')}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (isNaN(v) || v < 1) return;
                    if (v > item.stock) {
                      setStockErrors(err => ({ ...err, [item.productId]: `Only ${item.stock} in stock` }));
                    } else {
                      setStockErrors(err => ({ ...err, [item.productId]: null }));
                      updateQuantity(item.productId, v);
                    }
                  }}
                  className="w-10 text-center font-mono-tech text-sm text-paper bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label="Quantity"
                />
                <button
                  onClick={() => {
                    if (item.quantity >= item.stock) {
                      setStockErrors(err => ({ ...err, [item.productId]: `Only ${item.stock} in stock` }));
                    } else {
                      updateQuantity(item.productId, item.quantity + 1);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                  aria-label={t('cart.increaseQuantity')}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {stockErrors[item.productId] && (
                <p className="text-xs text-danger font-mono-tech">{stockErrors[item.productId]}</p>
              )}
            </div>

            {/* Desktop: line total */}
            <span className="hidden sm:block font-mono-tech text-paper w-20 text-right">
              {formatPrice(item.bulkPrice?.totalPriceCents || (item.priceCents * item.quantity), 'USD')}
            </span>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.productId)}
              className="text-steel hover:text-danger transition-colors shrink-0"
              aria-label={t('cart.removeItem', { name: item.name })}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <CartUpsell cartItems={items} />

      <div className="flex justify-end">
        <div className="w-full sm:w-80">
          <div className="flex justify-between text-paper-dim mb-2">
            <span>{t('cart.subtotal')}</span>
            <span className="font-mono-tech">{formatPrice(subtotalCents)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-flame text-sm mb-2">
              <span>{t('cart.bulkDiscountSavings')}</span>
              <span className="font-mono-tech">-{formatPrice(totalSavings)}</span>
            </div>
          )}
          <p className="text-xs text-steel mb-6">
            {t('cart.checkoutNote')}
          </p>
          <Link href="/checkout">
            <Button size="lg" className="w-full">
              {t('cart.proceedToCheckout')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
