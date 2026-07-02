"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function StickyAddToCart({ product, displayPrice }) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById("pdp-add-to-cart-btn");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!visible) return null;
  if (product.stock <= 0 && !product.allowPreorder) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-hairline shadow-2xl py-3 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-paper text-sm truncate">{product.name}</p>
          <p className="font-mono-tech text-flame text-sm">{formatPrice(displayPrice, "USD")}</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            addItem(product, 1);
            toast.success(`${product.name} added to cart`);
          }}
          className="shrink-0"
        >
          {product.allowPreorder && product.stock <= 0 ? "Pre-order" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
