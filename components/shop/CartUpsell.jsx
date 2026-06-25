"use client";

import { useEffect, useState } from "react";
import { Plus, Flame } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { toast } from "sonner";

export default function CartUpsell({ cartItems }) {
  const [suggestions, setSuggestions] = useState([]);
  const { addItem, items } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    const ids = cartItems.map((i) => i.productId).join(",");
    fetch(`/api/products/frequently-bought-together?ids=${ids}`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.products || []))
      .catch(() => {});
  }, [cartItems]);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-8 border-t border-hairline pt-6">
      <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
        Customers also bought
      </h3>
      <div className="space-y-3">
        {suggestions.map((p) => {
          const inCart = items.some((i) => i.productId === p._id.toString());
          return (
            <div key={p._id} className="flex items-center gap-3 border border-hairline rounded-sm p-3">
              <div className="w-10 h-10 bg-panel rounded-sm flex items-center justify-center shrink-0 overflow-hidden">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Flame className="w-4 h-4 text-steel/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-paper truncate">{p.name}</p>
                <p className="text-xs font-mono-tech text-steel">{formatPrice(p.priceCents, "USD")}</p>
              </div>
              <button
                onClick={() => {
                  if (!inCart) {
                    addItem({ _id: p._id, name: p.name, priceCents: p.priceCents, images: p.images, slug: p.slug }, 1);
                    toast.success(`${p.name} added to cart`);
                  }
                }}
                disabled={inCart}
                className="flex items-center gap-1 text-xs border border-hairline rounded-sm px-2.5 py-1.5 text-paper-dim hover:border-flame hover:text-flame transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> {inCart ? "In cart" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
