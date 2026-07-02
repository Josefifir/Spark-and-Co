"use client";

import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";

const FREE_SHIPPING_THRESHOLD_CENTS = parseInt(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || "5000", 10);

export default function FreeShippingBar() {
  const { subtotalCents } = useCart();
  const { formatPrice } = useCurrency();

  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) {
    return (
      <div className="text-xs text-success font-mono-tech text-center py-2 border-b border-hairline bg-success/5">
        ✓ You&apos;ve unlocked free shipping!
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;
  const pct = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));

  return (
    <div className="px-4 py-3 border-b border-hairline">
      <p className="text-xs text-paper-dim mb-1.5">
        Add <span className="text-paper font-medium">{formatPrice(remaining)}</span> more for free shipping
      </p>
      <div className="h-1 bg-panel-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-flame rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
