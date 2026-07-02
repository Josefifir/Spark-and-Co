"use client";

import { useEffect, useState } from "react";

const KEY = "recently-viewed";
const MAX = 6;

export function trackProductView(product) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [
      { slug: product.slug, name: product.name, priceCents: product.priceCents, image: product.images?.[0] },
      ...current.filter((p) => p.slug !== product.slug),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}

export function useRecentlyViewed(currentSlug) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      setItems(stored.filter((p) => p.slug !== currentSlug));
    } catch {}
  }, [currentSlug]);
  return items;
}
