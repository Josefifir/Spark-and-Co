"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";

export default function ProductsListClient({ products, categories, currentCategory }) {
  const { t } = useLocale();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-mono-tech text-flame tracking-wider">{t('products.catalog')}</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-paper mt-2">
          {t('products.allLighters')}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href="/products"
          className={`text-xs font-mono-tech uppercase tracking-wider px-3.5 py-2 rounded-sm border transition-colors ${
            currentCategory === ""
              ? "border-flame text-flame bg-flame/5"
              : "border-hairline text-paper-dim hover:border-steel"
          }`}
        >
          {t('products.all')}
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/products?category=${c.slug}`}
            className={`text-xs font-mono-tech uppercase tracking-wider px-3.5 py-2 rounded-sm border transition-colors ${
              currentCategory === c.slug
                ? "border-flame text-flame bg-flame/5"
                : "border-hairline text-paper-dim hover:border-steel"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          {t('products.noProducts')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// Made with Bob
