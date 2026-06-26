"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { csrfFetch } from "@/lib/auth/csrfFetch";
import { LayoutDashboard, Package, ShoppingCart, Tag, LogOut, Flame, Percent, MessageSquare, Truck, HelpCircle, BarChart2, Gift, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/discounts", label: "Discount Codes", icon: Percent },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/shipping", label: "Shipping Zones", icon: Truck },
  { href: "/admin/qa", label: "Q&A", icon: HelpCircle },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/gift-cards", label: "Gift Cards", icon: Gift },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login";

  const handleLogout = async () => {
    await csrfFetch("/api/admin/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-graphite">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-graphite flex">
      <aside className="w-60 border-r border-hairline flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-hairline">
          <Flame className="w-4 h-4 text-flame mr-2" />
          <span className="font-display font-bold text-sm text-paper">ADMIN</span>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  active ? "bg-flame/10 text-flame" : "text-paper-dim hover:text-paper hover:bg-panel"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-hairline">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-paper-dim hover:text-danger transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}