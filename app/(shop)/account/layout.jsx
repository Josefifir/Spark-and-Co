"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function AccountLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function checkAuth() {
    try {
      const res = await fetch("/api/customer/me");
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/customer/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-graphite flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flame mx-auto"></div>
          <p className="mt-4 text-paper-dim">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const navItems = [
    { href: "/account", label: "Profile", exact: true },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/referral", label: "Referral" },
  ];

  return (
    <div className="min-h-screen bg-graphite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page header row — title + mobile nav toggle inline */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-paper">My Account</h1>
            <p className="mt-1 text-sm sm:text-base text-paper-dim">
              Welcome back, {customer.firstName}!
            </p>
          </div>
          {/* Mobile nav toggle — sits in the normal flow, never overlaps header */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-9 h-9 border border-hairline rounded-sm text-paper hover:border-steel transition-colors"
            aria-label="Toggle account menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar — inline on desktop, collapsible on mobile */}
          <div className={`lg:col-span-1 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <nav className="bg-panel rounded-sm border border-hairline p-3 sm:p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-3 rounded-sm transition-colors text-sm touch-manipulation ${
                      isActive
                        ? "bg-flame/10 text-flame font-medium"
                        : "text-paper-dim hover:bg-panel-raised"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-sm text-danger hover:bg-danger/10 transition-colors text-sm touch-manipulation"
              >
                Logout
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob