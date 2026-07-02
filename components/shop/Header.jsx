"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCart } from "@/components/shop/CartContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useCustomerAuth } from "@/lib/auth/CustomerAuthContext";
import CurrencySwitcher from "@/components/shop/CurrencySwitcher";
import LanguageSwitcher from "@/components/shop/LanguageSwitcher";
import SearchBar from "@/components/shop/SearchBar";
import DarkModeToggle from "@/components/shop/DarkModeToggle";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { itemCount } = useCart();
  const { t } = useLocale();
  const { isLoggedIn } = useCustomerAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/products", label: t("nav.allLighters") },
    { href: "/products?category=torch", label: t("nav.torch") },
    { href: "/products?category=refillable", label: t("nav.refillable") },
    { href: "/products?category=electric", label: t("nav.electric") },
    { href: "/products?category=lighter fuel", label: t("nav.lighterFuel") },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-graphite/95 backdrop-blur border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <span className="text-flame text-lg sm:text-xl group-hover:animate-flicker">🔥</span>
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-paper whitespace-nowrap">
              STRIKE&nbsp;&&nbsp;CO.
            </span>
          </Link>

          {/* Desktop nav — xl breakpoint gives enough room for long German labels */}
          <nav className="hidden xl:flex items-center gap-5 text-sm text-paper-dim">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-paper transition-colors whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop-only switchers + search */}
            <div className="hidden sm:flex items-center gap-2">
              <SearchBar />
              <LanguageSwitcher />
              <CurrencySwitcher />
              <DarkModeToggle />
            </div>

            {/* Account */}
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-hairline hover:border-steel transition-colors"
              aria-label={isLoggedIn ? "My Account" : "Sign In"}
            >
              <User className="w-4 h-4 text-paper" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-hairline hover:border-steel transition-colors"
              aria-label={`${t("nav.cart")}, ${itemCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-paper" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-flame text-graphite text-[9px] font-bold w-4 h-4 min-w-[16px] min-h-[16px] rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Hamburger — mobile + tablet */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-sm border border-hairline hover:border-steel transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4 text-paper" /> : <Menu className="w-4 h-4 text-paper" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-30 bg-graphite/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="lg:hidden fixed top-14 sm:top-16 left-0 right-0 z-40 bg-graphite border-b border-hairline shadow-xl">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-paper-dim hover:text-paper hover:bg-panel px-3 py-3 rounded-sm transition-colors text-sm"
                >
                  {l.label}
                </Link>
              ))}
              {/* Switchers in mobile menu — align="left" so dropdowns open rightward */}
              <div className="flex items-center gap-3 px-3 pt-4 mt-2 border-t border-hairline">
                <LanguageSwitcher align="left" />
                <CurrencySwitcher align="left" />
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}

// Made with Bob
