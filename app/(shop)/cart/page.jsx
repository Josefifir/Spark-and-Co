"use client";

import Link from "next/link";
import { Minus, Plus, X, Flame, TrendingDown } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { calculateBulkPrice } from "@/lib/utils-pricing-client";
import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalCents, hydrated } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  const [itemsWithBulkPricing, setItemsWithBulkPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      setLoading(false);
      return;
    }

    // Fetch product details to get bulk pricing tiers
    const fetchProductDetails = async () => {
      try {
        const productIds = items.map(item => item.productId);
        const response = await fetch('/api/products');
        const data = await response.json();
        
        const enrichedItems = items.map(item => {
          const product = data.products?.find(p => p._id === item.productId);
          if (product && product.bulkPricingTiers) {
            const bulkPrice = calculateBulkPrice(
              item.priceCents,
              item.quantity,
              product.bulkPricingTiers
            );
            return {
              ...item,
              bulkPricingTiers: product.bulkPricingTiers,
              bulkPrice,
            };
          }
          return {
            ...item,
            bulkPrice: {
              unitPriceCents: item.priceCents,
              totalPriceCents: item.priceCents * item.quantity,
              discountPercent: 0,
              bulkApplied: false,
            },
          };
        });
        
        setItemsWithBulkPricing(enrichedItems);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setItemsWithBulkPricing(items.map(item => ({
          ...item,
          bulkPrice: {
            unitPriceCents: item.priceCents,
            totalPriceCents: item.priceCents * item.quantity,
            discountPercent: 0,
            bulkApplied: false,
          },
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [items, hydrated]);

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
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-paper mb-10">{t('cart.title')}</h1>

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
          <div key={item.productId} className="flex items-center gap-4 p-4">
            <div className="w-16 h-16 bg-panel-raised rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Flame className="w-6 h-6 text-steel/40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/products/${item.slug}`} className="font-medium text-paper hover:text-flame transition-colors block truncate">
                {item.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-mono-tech text-sm text-paper-dim">
                  {formatPrice(item.bulkPrice?.unitPriceCents || item.priceCents, 'USD')}
                </span>
                {item.bulkPrice?.bulkApplied && (
                  <span className="text-xs text-flame font-mono-tech">
                    ({item.bulkPrice.discountPercent}% {t('cart.off')})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center border border-hairline rounded-sm">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                aria-label={t('cart.decreaseQuantity')}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-mono-tech text-sm text-paper">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-paper-dim hover:text-paper"
                aria-label={t('cart.increaseQuantity')}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <span className="font-mono-tech text-paper w-20 text-right">
              {formatPrice(item.bulkPrice?.totalPriceCents || (item.priceCents * item.quantity), 'USD')}
            </span>

            <button
              onClick={() => removeItem(item.productId)}
              className="text-steel hover:text-danger transition-colors"
              aria-label={t('cart.removeItem', { name: item.name })}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

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
