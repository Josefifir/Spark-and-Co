"use client";

import { useEffect, useState } from "react";
import { Package, Plus } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { toast } from "sonner";
import Link from "next/link";

export default function BundleDeals() {
  const [bundles, setBundles] = useState([]);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetch("/api/bundles")
      .then(r => r.json())
      .then(d => setBundles(d.bundles || []))
      .catch(() => {});
  }, []);

  if (bundles.length === 0) return null;

  const addBundleToCart = (bundle) => {
    const outOfStock = bundle.items.some(item => !item.product?.stock || item.product.stock < item.quantity);
    if (outOfStock) {
      toast.error("One or more items in this bundle are out of stock.");
      return;
    }
    for (const item of bundle.items) {
      if (item.product) {
        addItem({
          _id: item.product._id,
          name: item.product.name,
          priceCents: item.product.priceCents,
          images: item.product.images,
          slug: item.product.slug,
        }, item.quantity);
      }
    }
    toast.success(`${bundle.name} added to cart! 🎉`);
  };

  return (
    <section className="py-12 border-t border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-flame" />
          <h2 className="font-display text-2xl font-bold text-paper">Bundle Deals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map(bundle => (
            <div key={bundle._id} className="border border-hairline rounded-sm overflow-hidden bg-panel hover:border-steel transition-colors">
              {bundle.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bundle.image} alt={bundle.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display font-bold text-paper">{bundle.name}</h3>
                  <span className="shrink-0 text-xs font-bold text-success bg-success/10 border border-success/30 rounded-sm px-2 py-0.5">
                    Save {bundle.savingsPercent}%
                  </span>
                </div>
                {bundle.description && (
                  <p className="text-sm text-paper-dim mb-3">{bundle.description}</p>
                )}

                {/* Items list */}
                <div className="space-y-1.5 mb-4">
                  {bundle.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-steel font-mono-tech text-xs">{item.quantity}×</span>
                      {item.product ? (
                        <Link href={`/products/${item.product.slug}`} className="text-paper-dim hover:text-flame transition-colors truncate">
                          {item.product.name}
                        </Link>
                      ) : (
                        <span className="text-paper-dim">Item unavailable</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-mono-tech text-xl text-flame font-medium">
                    {formatPrice(bundle.bundlePriceCents, "USD")}
                  </span>
                  <span className="font-mono-tech text-sm text-steel line-through">
                    {formatPrice(bundle.originalTotalCents, "USD")}
                  </span>
                </div>

                <button
                  onClick={() => addBundleToCart(bundle)}
                  className="w-full flex items-center justify-center gap-2 bg-flame text-graphite font-medium rounded-sm py-2.5 hover:bg-flame-bright transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add bundle to cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
