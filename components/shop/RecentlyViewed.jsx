"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewed } from "@/lib/recentlyViewed";
import { useCurrency } from "@/lib/currency/CurrencyContext";

export default function RecentlyViewed({ currentSlug }) {
  const items = useRecentlyViewed(currentSlug);
  const { formatPrice } = useCurrency();

  if (items.length === 0) return null;

  return (
    <section className="border-t border-hairline pt-10 mt-10">
      <p className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">Recently viewed</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {items.map((item) => (
          <Link key={item.slug} href={`/products/${item.slug}`} className="group block">
            <div className="aspect-square bg-panel border border-hairline rounded-sm overflow-hidden mb-2 relative">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-steel/30 text-3xl">🔥</div>
              )}
            </div>
            <p className="text-xs text-paper truncate">{item.name}</p>
            <p className="text-xs font-mono-tech text-flame">{formatPrice(item.priceCents)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
