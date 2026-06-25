'use client';

import Link from "next/link";
import { ShieldCheck, Lock, Bitcoin } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-hairline mt-12 sm:mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-flame">🔥</span>
              <span className="font-display font-bold text-paper">STRIKE & CO.</span>
            </div>
            <p className="text-sm text-paper-dim leading-relaxed">
              Machined lighters for everyday carry. Built to spec, lit to last.
            </p>
          </div>

          <div>
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/products" className="text-paper-dim hover:text-paper transition-colors">{t('nav.allLighters')}</Link></li>
              <li><Link href="/products?category=torch" className="text-paper-dim hover:text-paper transition-colors">{t('nav.torch')}</Link></li>
              <li><Link href="/products?category=electric" className="text-paper-dim hover:text-paper transition-colors">{t('nav.electric')}</Link></li>
              <li><Link href="/products?category=refillable" className="text-paper-dim hover:text-paper transition-colors">{t('nav.refillable')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/legal/privacy" className="text-paper-dim hover:text-paper transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link href="/legal/terms" className="text-paper-dim hover:text-paper transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href="/legal/impressum" className="text-paper-dim hover:text-paper transition-colors">{t('footer.impressum')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
              Security
            </h3>
            <ul className="space-y-3 text-sm text-paper-dim">
              <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-flame" /> TLS-encrypted checkout</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-flame" /> No card data stored</li>
              <li className="flex items-center gap-2"><Bitcoin className="w-3.5 h-3.5 text-flame" /> Bitcoin & SEPA accepted</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 border-t border-hairline">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
            <p className="text-xs text-steel">© {new Date().getFullYear()} Strike & Co. {t('footer.allRightsReserved')}</p>
            <Link href="/admin/login" className="text-xs text-steel hover:text-paper-dim transition-colors">
              Staff login
            </Link>
          </div>
          <p className="text-xs text-paper-dim text-center leading-relaxed">
            Must be 18+ to purchase. Lighters are restricted items in some regions — check local
            regulations before ordering. Keep out of reach of children.
          </p>
        </div>
      </div>
    </footer>
  );
}

// Made with Bob
