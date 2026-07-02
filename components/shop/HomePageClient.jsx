"use client";

import Link from "next/link";
import { ShieldCheck, Lock, Bitcoin, Truck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";
import ProductCard from "@/components/shop/ProductCard";
import BundleDeals from "@/components/shop/BundleDeals";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function HomePageClient({ products }) {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  // Persist ?ref= code in localStorage so checkout can pick it up
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("referral_code", ref.toUpperCase());
  }, [searchParams]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-hairline grain-overlay">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono-tech text-flame border border-flame/30 bg-flame/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-sm mb-6 sm:mb-8">
              <span className="animate-flicker">●</span> {t('home.nowShipping')}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-paper leading-[1.1] sm:leading-[1.05] mb-4 sm:mb-6">
              {t('home.heroTitle1')} <span className="text-flame">{t('home.heroTitle2')}</span>,
              <br />
              {t('home.heroTitle3')}
            </h1>
            <p className="text-paper-dim text-sm sm:text-base md:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link
                href="/products"
                className="bg-flame text-graphite font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-sm hover:bg-flame-bright transition-colors text-center text-sm sm:text-base"
              >
                {t('home.shopLineup')}
              </Link>
              <Link
                href="/products?category=torch"
                className="border border-hairline text-paper px-6 sm:px-7 py-3 sm:py-3.5 rounded-sm hover:border-steel transition-colors text-center text-sm sm:text-base"
              >
                {t('home.torchLighters')}
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative flame mark */}
        <div className="hidden md:block absolute right-12 top-1/2 -translate-y-1/2 text-[220px] leading-none text-flame/5 select-none animate-strike">
          🔥
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-hairline bg-panel/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            { icon: Lock, label: t('home.tlsEncrypted') },
            { icon: ShieldCheck, label: t('home.noCardData') },
            { icon: Bitcoin, label: t('home.sepaAccepted') },
            { icon: Truck, label: t('home.discreetPackaging') },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-flame shrink-0" />
              <span className="text-[10px] sm:text-xs md:text-sm text-paper-dim font-mono-tech leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <span className="text-[10px] sm:text-xs font-mono-tech text-flame tracking-wider">{t('home.catalogLabel')}</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-paper mt-1 sm:mt-2">{t('home.featuredLighters')}</h2>
          </div>
          <Link href="/products" className="text-xs sm:text-sm text-paper-dim hover:text-paper transition-colors whitespace-nowrap">
            {t('home.viewAll')}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
            {t('home.noProducts')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Bundle deals */}
      <BundleDeals />

      {/* Press / social proof strip */}
      <section className="border-t border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-center text-[10px] font-mono-tech text-steel uppercase tracking-wider mb-4">As seen in</p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 items-center">
            {["EDC Weekly", "r/EDC", "BestLighters.com", "GearPatrol"].map((name) => (
              <span key={name} className="text-sm font-medium text-steel/50 hover:text-steel transition-colors">{name}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Made with Bob
