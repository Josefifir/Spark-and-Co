"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/shop/CartContext";

const SESSION_KEY = "cart-session-id";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// This component syncs cart state to the server for abandoned cart recovery.
// It's a background component — renders nothing.
export default function AbandonedCartTracker({ customerEmail }) {
  const { items, hydrated } = useCart();
  const syncTimeout = useRef(null);

  useEffect(() => {
    if (!hydrated) return;

    // Debounce: wait 2 seconds after last cart change before syncing
    clearTimeout(syncTimeout.current);

    if (items.length === 0) {
      // Cart cleared — don't send (recovery not needed)
      return;
    }

    syncTimeout.current = setTimeout(() => {
      const sessionId = getSessionId();
      if (!sessionId) return;

      fetch("/api/cart/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customerEmail: customerEmail || undefined,
          items: items.map(i => ({
            productId: i.productId,
            name: i.name,
            priceCents: i.priceCents,
            quantity: i.quantity,
            image: i.image,
            slug: i.slug,
          })),
        }),
      }).catch(() => {});
    }, 2000);

    return () => clearTimeout(syncTimeout.current);
  }, [items, hydrated, customerEmail]);

  return null;
}

// Call this when checkout is completed to mark cart as recovered
export function markCartRecovered() {
  if (typeof window === "undefined") return;
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  fetch(`/api/cart/abandon?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" })
    .catch(() => {});
}
