"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { toast } from "sonner";

export default function WishlistPageClient() {
  const [wishlist, setWishlist] = useState(null);
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();

  const load = () => {
    fetch("/api/customer/wishlist")
      .then((r) => r.json())
      .then((d) => setWishlist(d.wishlist || []));
  };

  useEffect(() => { load(); }, []);

  const remove = async (productId) => {
    await fetch(`/api/customer/wishlist?productId=${productId}`, { method: "DELETE" });
    setWishlist((prev) => prev.filter((p) => p._id !== productId));
    toast("Removed from wishlist");
  };

  if (wishlist === null) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-steel text-sm">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Wishlist</h1>
        <span className="text-steel text-sm">({wishlist.length})</span>
      </div>

      {wishlist.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center">
          <Heart className="w-10 h-10 text-steel/30 mx-auto mb-3" />
          <p className="text-paper-dim mb-4">Your wishlist is empty.</p>
          <Link href="/products" className="text-flame hover:text-flame-bright text-sm underline">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {wishlist.map((product) => {
            const isOnSale = product.salePriceCents && product.saleEndsAt && new Date(product.saleEndsAt) > new Date();
            const price = isOnSale ? product.salePriceCents : product.priceCents;
            return (
              <div key={product._id} className="flex items-center gap-4 border border-hairline rounded-sm p-4">
                <Link href={`/products/${product.slug}`} className="shrink-0">
                  <div className="w-16 h-16 bg-panel border border-hairline rounded-sm overflow-hidden relative">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-steel/30 text-2xl">🔥</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product.slug}`} className="text-paper font-medium hover:text-flame transition-colors block truncate">
                    {product.name}
                  </Link>
                  <p className="font-mono-tech text-flame text-sm">{formatPrice(price)}</p>
                  {product.stock === 0 && <p className="text-xs text-danger mt-0.5">Out of stock</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {product.stock > 0 && (
                    <button
                      onClick={() => { addItem(product, 1); toast.success(`${product.name} added to cart`); }}
                      className="p-2 rounded-sm border border-hairline hover:border-flame hover:text-flame text-steel transition-colors"
                      aria-label="Add to cart"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(product._id)}
                    className="p-2 rounded-sm border border-hairline hover:border-danger hover:text-danger text-steel transition-colors"
                    aria-label="Remove"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
