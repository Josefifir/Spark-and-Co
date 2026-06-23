"use client";

import Link from "next/link";
import { useState } from "react";
import { Flame, TrendingDown } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  const [adding, setAdding] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem(product, 1);
    toast.success(t('success.addedToCart'));
    setTimeout(() => setAdding(false), 400);
  };

  // Check if product has bulk pricing
  const hasBulkPricing = product.bulkPricingTiers && product.bulkPricingTiers.length > 0;
  const firstTier = hasBulkPricing ? product.bulkPricingTiers[0] : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block border border-hairline rounded-sm overflow-hidden bg-panel hover:border-steel transition-colors"
    >
      <div className="aspect-square bg-panel-raised relative flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Flame className="w-12 h-12 text-steel/40" />
        )}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute top-3 left-3 bg-graphite/90 text-flame text-[10px] font-mono-tech px-2 py-1 rounded-sm border border-flame/30">
            {t('product.onlyXLeft', {}, `ONLY ${product.stock} LEFT`).replace('{count}', product.stock)}
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 left-3 bg-graphite/90 text-paper-dim text-[10px] font-mono-tech px-2 py-1 rounded-sm border border-hairline">
            {t('product.outOfStock')}
          </span>
        )}
        {hasBulkPricing && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-flame/90 text-graphite text-[10px] font-mono-tech px-2 py-1 rounded-sm border border-flame flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {t('product.bulkDiscount')}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-mono-tech text-steel uppercase tracking-wider">
            {product.category}
          </span>
          <span className="text-[10px] font-mono-tech text-steel">{product.sku}</span>
        </div>
        <h3 className="font-display font-medium text-paper mb-2 leading-snug">{product.name}</h3>
        
        {hasBulkPricing && firstTier && (
          <p className="text-[10px] text-flame mb-2 font-mono-tech">
            {t('product.buyXGetYOff', { min: firstTier.minQuantity, discount: firstTier.discountPercent })}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="font-mono-tech text-flame font-medium">
            {formatPrice(product.priceCents, 'USD')}
          </span>
          <Button size="sm" onClick={handleAdd} disabled={product.stock === 0 || adding}>
            {product.stock === 0 ? t('product.outOfStock') : adding ? t('common.loading') : t('product.addToCart')}
          </Button>
        </div>
      </div>
    </Link>
  );
}

// Made with Bob
