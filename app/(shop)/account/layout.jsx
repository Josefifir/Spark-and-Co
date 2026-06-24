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
  ];

  return (
    <div className="min-h-screen bg-graphite">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-panel border border-hairline rounded-md text-paper hover:bg-panel-raised transition-colors shadow-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header - Hidden on mobile when menu is open */}
        <div className={`mb-6 sm:mb-8 ${mobileMenuOpen ? 'hidden lg:block' : 'block'}`}>
          <h1 className="text-2xl sm:text-3xl font-bold text-paper">My Account</h1>
          <p className="mt-2 text-sm sm:text-base text-paper-dim">
            Welcome back, {customer.firstName}!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar Navigation - Mobile overlay */}
          <div className={`
            lg:col-span-1
            fixed lg:static inset-0 z-40 lg:z-auto
            transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile overlay backdrop */}
            {mobileMenuOpen && (
              <div 
                className="lg:hidden fixed inset-0 bg-graphite/90 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
            )}
            
            {/* Sidebar content */}
            <div className="relative lg:static h-full lg:h-auto pt-20 lg:pt-0 px-4 lg:px-0">
              <nav className="bg-panel rounded-lg border border-hairline p-3 sm:p-4 space-y-1 sm:space-y-2 max-w-sm lg:max-w-none mx-auto">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-3 sm:py-2 rounded-md transition-colors text-sm sm:text-base touch-manipulation ${
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
                  className="w-full text-left px-4 py-3 sm:py-2 rounded-md text-danger hover:bg-danger/10 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob