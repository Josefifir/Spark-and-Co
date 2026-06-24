"use client";

import Link from "next/link";
import { ShoppingBag, ShieldCheck, User } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import CurrencySwitcher from "@/components/shop/CurrencySwitcher";
import LanguageSwitcher from "@/components/shop/LanguageSwitcher";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { itemCount } = useCart();
  const { t } = useLocale();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [pathname]); // Re-check auth when route changes

  async function checkAuth() {
    try {
      const res = await fetch("/api/customer/me", { cache: "no-store" });
      setIsLoggedIn(res.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-graphite/90 backdrop-blur border-b border-hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
          <span className="text-flame text-lg sm:text-xl group-hover:animate-flicker">🔥</span>
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-paper whitespace-nowrap">
            STRIKE&nbsp;&&nbsp;CO.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-paper-dim">
          <Link href="/products" className="hover:text-paper transition-colors">
            {t('nav.allLighters')}
          </Link>
          <Link href="/products?category=torch" className="hover:text-paper transition-colors">
            {t('nav.torch')}
          </Link>
          <Link href="/products?category=refillable" className="hover:text-paper transition-colors">
            {t('nav.refillable')}
          </Link>
          <Link href="/products?category=electric" className="hover:text-paper transition-colors">
            {t('nav.electric')}
          </Link>
          <Link href="/products?category=lighter fuel" className="hover:text-paper transition-colors">
            {t('nav.lighterFuel')}
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <span className="hidden lg:flex items-center gap-1.5 text-xs text-steel font-mono-tech">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('nav.encryptedCheckout')}
          </span>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-hairline hover:border-steel transition-colors"
            aria-label={isLoggedIn ? "My Account" : "Sign In"}
          >
            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-paper" />
          </Link>
          <Link
            href="/cart"
            className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-hairline hover:border-steel transition-colors"
            aria-label={`${t('nav.cart')}, ${itemCount} items`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-paper" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-flame text-graphite text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-4.5 sm:h-4.5 min-w-[16px] min-h-[16px] sm:min-w-[18px] sm:min-h-[18px] rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

// Made with Bob
