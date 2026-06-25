"use client";

import { useState } from "react";
import Image from "next/image";
import { Flame, Minus, Plus, ShieldCheck, Lock } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import ProductCard from "@/components/shop/ProductCard";
import ReviewList from "@/components/shop/ReviewList";
import ReviewForm from "@/components/shop/ReviewForm";

export default function ProductDetailClient({ product, relatedProducts = [], reviews = [], reviewToken = null }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success(t('success.addedToCartWithQuantity', { quantity, name: product.name }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        {/* Image */}
        <div className="aspect-square bg-panel border border-hairline rounded-sm relative flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <Flame className="w-20 h-20 text-steel/30" />
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-xs font-mono-tech text-flame uppercase tracking-wider">
            {product.category}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-paper mt-2 mb-4">
            {product.name}
          </h1>
          <p className="text-paper-dim leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center justify-between border-y border-hairline py-4 mb-6">
            <span className="font-mono-tech text-2xl text-flame font-medium">
              {formatPrice(product.priceCents, 'USD')}
            </span>
            <span className="text-xs font-mono-tech text-steel">SKU {product.sku}</span>
          </div>

          {product.stock > 0 ? (
            <>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-mono-tech text-paper-dim uppercase">{t('product.quantity')}</span>
                <div className="flex items-center border border-hairline rounded-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-paper-dim hover:text-paper"
                    aria-label={t('cart.decreaseQuantity')}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-mono-tech text-paper">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-paper-dim hover:text-paper"
                    aria-label={t('cart.increaseQuantity')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-steel">
                  {t('product.inStock', { count: product.stock })}
                </span>
              </div>

              <Button size="lg" className="w-full" onClick={handleAdd}>
                {t('product.addToCart')} — {formatPrice(product.priceCents * quantity, 'USD')}
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full" disabled>
              {t('product.outOfStock')}
            </Button>
          )}

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-paper-dim">
              <Lock className="w-4 h-4 text-flame" /> {t('product.encryptedCheckout')}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-paper-dim">
              <ShieldCheck className="w-4 h-4 text-flame" /> {t('product.ageRestriction')}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-hairline">
          <h2 className="font-display text-2xl font-bold text-paper mb-8">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Customer reviews section */}
      <section className="mt-20 pt-12 border-t border-hairline">
        <h2 className="font-display text-2xl font-bold text-paper mb-8">{t('reviews.customerReviews')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <ReviewList reviews={reviews} averageRating={product.averageRating} reviewCount={product.reviewCount} />
          </div>
          <div>
            {reviewToken ? (
              <ReviewForm token={reviewToken} product={product} />
            ) : (
              <div className="bg-panel border border-hairline rounded-sm p-6 text-center">
                <p className="text-sm text-paper-dim mb-3">
                  {t('reviews.purchasePrompt')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Made with Bob
