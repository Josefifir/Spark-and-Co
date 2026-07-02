"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Flame, Minus, Plus, Play, Clock } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import ProductCard from "@/components/shop/ProductCard";
import ReviewList from "@/components/shop/ReviewList";
import ReviewForm from "@/components/shop/ReviewForm";
import TrustBadges from "@/components/shop/TrustBadges";
import FlashSaleBadge from "@/components/shop/FlashSaleBadge";
import ProductSpecsTable from "@/components/shop/ProductSpecsTable";
import ShippingEstimator from "@/components/shop/ShippingEstimator";
import ProductQA from "@/components/shop/ProductQA";
import StickyAddToCart from "@/components/shop/StickyAddToCart";
import WishlistButton from "@/components/shop/WishlistButton";
import PersonalisationPreview from "@/components/shop/PersonalisationPreview";
import RecentlyViewed from "@/components/shop/RecentlyViewed";
import { CompareButton } from "@/components/shop/ProductCompare";
import { trackProductView } from "@/lib/recentlyViewed";

export default function ProductDetailClient({ product, relatedProducts = [], reviews = [], reviewToken = null }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLocale();
  const [quantity, setQuantity] = useState(1);
  const [soldToday, setSoldToday] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [personalisationText, setPersonalisationText] = useState("");

  useEffect(() => {
    fetch(`/api/products/${product.slug}/sold-today`)
      .then((r) => r.json())
      .then((d) => setSoldToday(d.count || 0))
      .catch(() => {});
    trackProductView(product);
  }, [product.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOnSale = product.salePriceCents && product.saleEndsAt && new Date(product.saleEndsAt) > new Date();
  const displayPrice = isOnSale ? product.salePriceCents : product.priceCents;
  const inStock = product.stock > 0;
  const isPreorderAvailable = !inStock && product.allowPreorder;

  const handleAdd = () => {
    addItem({ ...product, personalisationText: product.personalisationEnabled ? personalisationText : undefined }, quantity);
    toast.success(t('success.addedToCartWithQuantity', { quantity, name: product.name }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square bg-panel border border-hairline rounded-sm relative flex items-center justify-center overflow-hidden">
            {showVideo && product.videoUrl ? (
              <video
                src={product.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : product.images?.[activeImage] ? (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <Flame className="w-20 h-20 text-steel/30" />
            )}

            {/* Video play button overlay */}
            {product.videoUrl && !showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition-colors"
                aria-label="Play video"
              >
                <Play className="w-4 h-4 fill-white" />
              </button>
            )}
          </div>

          {/* Thumbnail strip (multiple images + video thumb) */}
          {(product.images?.length > 1 || product.videoUrl) && (
            <div className="flex gap-2">
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveImage(i); setShowVideo(false); }}
                  className={`w-14 h-14 rounded-sm border overflow-hidden shrink-0 transition-colors ${activeImage === i && !showVideo ? "border-flame" : "border-hairline"}`}
                >
                  <Image src={img} alt="" width={56} height={56} className="object-cover w-full h-full" />
                </button>
              ))}
              {product.videoUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`w-14 h-14 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${showVideo ? "border-flame bg-flame/10" : "border-hairline bg-panel"}`}
                >
                  <Play className="w-5 h-5 text-flame" />
                </button>
              )}
            </div>
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

          {isOnSale && (
            <FlashSaleBadge
              salePriceCents={product.salePriceCents}
              saleEndsAt={product.saleEndsAt}
              originalPriceCents={product.priceCents}
              formatPrice={formatPrice}
            />
          )}

          <div className="flex items-center justify-between border-y border-hairline py-4 mb-6">
            <span className="font-mono-tech text-2xl text-flame font-medium">
              {formatPrice(displayPrice, 'USD')}
            </span>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-xs font-mono-tech text-steel">SKU {product.sku}</span>
              {soldToday > 0 && (
                <span className="text-xs text-success">🔥 {soldToday} sold today</span>
              )}
              {inStock && product.stock <= 5 && (
                <span className="text-xs text-danger font-medium">Only {product.stock} left!</span>
              )}
            </div>
          </div>

          {/* Personalisation input + live preview */}
          {product.personalisationEnabled && (
            <div className="mb-5">
              <label className="block text-xs font-mono-tech text-paper-dim uppercase tracking-wider mb-1.5">
                {product.personalisationPrompt || "Personalisation / Engraving"}
              </label>
              <input
                type="text"
                value={personalisationText}
                onChange={e => setPersonalisationText(e.target.value.slice(0, product.personalisationMaxLength || 20))}
                placeholder={`Max ${product.personalisationMaxLength || 20} characters`}
                className="w-full bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors text-sm"
                maxLength={product.personalisationMaxLength || 20}
              />
              <p className="text-xs text-steel mt-1">{personalisationText.length}/{product.personalisationMaxLength || 20} characters</p>
              <PersonalisationPreview text={personalisationText} maxLength={product.personalisationMaxLength || 20} />
            </div>
          )}

          {inStock ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <WishlistButton productId={product._id} />
                <CompareButton product={product} />
              </div>
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

              <Button id="pdp-add-to-cart-btn" size="lg" className="w-full" onClick={handleAdd}>
                {t('product.addToCart')} — {formatPrice(displayPrice * quantity, 'USD')}
              </Button>
            </>
          ) : isPreorderAvailable ? (
            <>
              <div className="bg-flame/10 border border-flame/30 rounded-sm px-4 py-3 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-flame shrink-0" />
                <div>
                  <p className="text-sm font-medium text-flame">Pre-order available</p>
                  {product.preorderNote && (
                    <p className="text-xs text-paper-dim mt-0.5">{product.preorderNote}</p>
                  )}
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={handleAdd}>
                Pre-order — {formatPrice(displayPrice, 'USD')}
              </Button>
            </>
          ) : (
            <Button size="lg" className="w-full" disabled>
              {t('product.outOfStock')}
            </Button>
          )}

          <TrustBadges className="mt-8" />

          {/* Specs table */}
          <ProductSpecsTable specs={product.specs} />

          {/* Shipping estimator */}
          <ShippingEstimator productId={product._id} priceCents={displayPrice} />
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

      {/* Q&A section */}
      <ProductQA slug={product.slug} />

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

      {/* Recently viewed */}
      <RecentlyViewed currentSlug={product.slug} />

      {/* Sticky add to cart bar (appears when main CTA scrolls out of view) */}
      <StickyAddToCart product={product} displayPrice={displayPrice} />
    </div>
  );
}

// Made with Bob
