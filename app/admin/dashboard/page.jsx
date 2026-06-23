"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Package, ShoppingCart, AlertTriangle, DollarSign, Users, 
  TrendingUp, TrendingDown, Star, Tag, Globe, CreditCard 
} from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";

function StatCard({ icon: Icon, label, value, accent, subtitle, trend }) {
  return (
    <div className="border border-hairline rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono-tech text-steel uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${accent ? "text-flame" : "text-steel"}`} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-paper">{value}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`text-xs flex items-center gap-1 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-steel mt-1">{subtitle}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
      {children}
    </h2>
  );
}

function DataTable({ headers, rows, emptyMessage = "No data available" }) {
  return (
    <div className="border border-hairline rounded-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-panel border-b border-hairline">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="text-left p-3 text-xs font-mono-tech text-steel uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-5 text-center text-paper-dim text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-panel transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="p-3 text-sm text-paper">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const STATUS_COLORS = {
  paid: "text-success",
  pending: "text-flame",
  failed: "text-danger",
  refunded: "text-steel",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="font-display text-2xl font-bold text-paper mb-8">Dashboard</h1>
        <p className="text-paper-dim">Loading analytics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 max-w-7xl">
        <h1 className="font-display text-2xl font-bold text-paper mb-8">Dashboard</h1>
        <p className="text-danger">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="font-display text-2xl font-bold text-paper mb-8">Dashboard</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard 
          icon={DollarSign} 
          label="Total Revenue" 
          value={formatPrice(stats.overview.totalRevenueCents)} 
          accent 
          subtitle={`${formatPrice(stats.overview.revenueThisMonthCents)} this month`}
          trend={stats.overview.revenueGrowthPercent}
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Paid Orders" 
          value={stats.overview.paidOrders} 
          subtitle={`${stats.overview.ordersToday} today, ${stats.overview.ordersThisMonth} this month`}
        />
        <StatCard 
          icon={Package} 
          label="Active Products" 
          value={stats.overview.totalProducts} 
          subtitle={`Avg order: ${formatPrice(stats.overview.averageOrderValueCents)}`}
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Low Stock" 
          value={stats.overview.lowStockProducts} 
          accent={stats.overview.lowStockProducts > 0}
          subtitle={`${stats.overview.pendingOrders} pending orders`}
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div>
          <SectionTitle>Revenue by Currency</SectionTitle>
          <DataTable
            headers={["Currency", "Orders", "Revenue"]}
            rows={stats.revenue.byCurrency.map(r => [
              r.currency,
              r.orderCount.toString(),
              formatPrice(r.totalCents, r.currency.toLowerCase())
            ])}
            emptyMessage="No revenue data"
          />
        </div>

        <div>
          <SectionTitle>Revenue by Payment Method</SectionTitle>
          <DataTable
            headers={["Method", "Orders", "Revenue"]}
            rows={stats.revenue.byPaymentMethod.map(r => [
              <span key={r.method} className="capitalize flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {r.method}
              </span>,
              r.orderCount.toString(),
              formatPrice(r.totalCents)
            ])}
            emptyMessage="No payment data"
          />
        </div>
      </div>

      {/* Product Analytics */}
      <div className="mb-10">
        <SectionTitle>Top Selling Products</SectionTitle>
        <DataTable
          headers={["Product", "Quantity Sold", "Revenue"]}
          rows={stats.products.topSelling.map(p => [
            p.name,
            p.quantitySold.toString(),
            formatPrice(p.revenueCents)
          ])}
          emptyMessage="No sales data yet"
        />
      </div>

      {/* Customer Analytics */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Customer Insights</SectionTitle>
          </div>
          <div className="border border-hairline rounded-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Total Customers</span>
              <span className="font-mono-tech text-lg text-paper">{stats.customers.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">New This Month</span>
              <span className="font-mono-tech text-lg text-paper">{stats.customers.newThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Repeat Customers</span>
              <span className="font-mono-tech text-lg text-paper">{stats.customers.repeatCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Repeat Rate</span>
              <span className="font-mono-tech text-lg text-paper">
                {stats.customers.total > 0 
                  ? ((stats.customers.repeatCustomers / stats.customers.total) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Top Countries</SectionTitle>
          <DataTable
            headers={["Country", "Orders", "Revenue"]}
            rows={stats.customers.topCountries.slice(0, 5).map(c => [
              <span key={c.country} className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {c.country}
              </span>,
              c.orderCount.toString(),
              formatPrice(c.revenueCents)
            ])}
            emptyMessage="No geographic data"
          />
        </div>
      </div>

      {/* Discount & Review Analytics */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div>
          <SectionTitle>Discount Performance</SectionTitle>
          <div className="border border-hairline rounded-sm p-5 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Active Codes</span>
              <span className="font-mono-tech text-lg text-paper">{stats.discounts.activeCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Total Discounts Given</span>
              <span className="font-mono-tech text-lg text-flame">
                {formatPrice(stats.discounts.totalDiscountGivenCents)}
              </span>
            </div>
          </div>
          {stats.discounts.topCodes.length > 0 && (
            <DataTable
              headers={["Code", "Uses", "Total Discount"]}
              rows={stats.discounts.topCodes.map(d => [
                <span key={d.code} className="flex items-center gap-2 font-mono-tech">
                  <Tag className="w-4 h-4" />
                  {d.code}
                </span>,
                d.usageCount.toString(),
                formatPrice(d.totalDiscountCents)
              ])}
            />
          )}
        </div>

        <div>
          <SectionTitle>Review Analytics</SectionTitle>
          <div className="border border-hairline rounded-sm p-5 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Total Reviews</span>
              <span className="font-mono-tech text-lg text-paper">{stats.reviews.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Pending Approval</span>
              <span className="font-mono-tech text-lg text-flame">{stats.reviews.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-steel">Average Rating</span>
              <span className="font-mono-tech text-lg text-paper flex items-center gap-1">
                <Star className="w-4 h-4 fill-flame text-flame" />
                {stats.reviews.averageRating}
              </span>
            </div>
          </div>
          {stats.reviews.topRatedProducts.length > 0 && (
            <DataTable
              headers={["Product", "Rating", "Reviews"]}
              rows={stats.reviews.topRatedProducts.map(p => [
                p.productName,
                <span key={p.productId} className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-flame text-flame" />
                  {p.avgRating.toFixed(1)}
                </span>,
                p.reviewCount.toString()
              ])}
            />
          )}
        </div>
      </div>

      {/* Products Needing Restock */}
      {stats.products.needingRestock.length > 0 && (
        <div className="mb-10">
          <SectionTitle>Products Needing Restock</SectionTitle>
          <DataTable
            headers={["Product", "Current Stock", "Status"]}
            rows={stats.products.needingRestock.map(p => [
              p.name,
              p.stock.toString(),
              <span key={p._id} className={`text-xs ${p.stock === 0 ? 'text-danger' : 'text-flame'}`}>
                {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
              </span>
            ])}
          />
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Recent Orders</SectionTitle>
          <Link href="/admin/orders" className="text-xs text-flame hover:text-flame-bright">
            View all →
          </Link>
        </div>
        <div className="border border-hairline rounded-sm">
          <div className="divide-y divide-hairline">
            {stats.recentOrders.length === 0 && (
              <p className="p-5 text-paper-dim text-sm">No orders yet.</p>
            )}
            {stats.recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders/${order._id}`}
                className="flex items-center justify-between p-5 hover:bg-panel transition-colors"
              >
                <div>
                  <span className="font-mono-tech text-sm text-paper">{order.orderNumber}</span>
                  <p className="text-xs text-steel mt-0.5">{order.customerEmail}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono-tech text-sm text-paper">
                    {formatPrice(order.totalCents, order.currency)}
                  </span>
                  <p className={`text-xs mt-0.5 ${STATUS_COLORS[order.paymentStatus] || "text-steel"}`}>
                    {order.paymentStatus}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
