"use client";

import { useEffect, useState } from "react";
import { BarChart2, Users, TrendingDown, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";

function SectionTitle({ children }) {
  return <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{children}</h2>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><p className="text-paper-dim">Loading analytics…</p></div>;
  if (!data) return <div className="p-8"><p className="text-danger">Failed to load analytics.</p></div>;

  const critical = data.forecast.filter((p) => p.daysUntilOut !== null && p.daysUntilOut <= 14);
  const warning  = data.forecast.filter((p) => p.daysUntilOut !== null && p.daysUntilOut > 14 && p.daysUntilOut <= 30);

  return (
    <div className="p-8 max-w-6xl space-y-12">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Advanced Analytics</h1>
      </div>

      {/* Inventory Forecast */}
      <section>
        <SectionTitle>Inventory Forecast</SectionTitle>
        {critical.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-danger mb-4 bg-danger/5 border border-danger/20 rounded-sm px-4 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {critical.length} product{critical.length > 1 ? "s" : ""} will run out in ≤ 14 days at current sales rate.
          </div>
        )}
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panel border-b border-hairline">
              <tr>
                {["Product", "Stock", "Sold / 30d", "Daily rate", "Est. runout"].map((h) => (
                  <th key={h} className="text-left p-3 font-mono-tech text-xs text-steel uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.forecast.map((p) => {
                const urgent = p.daysUntilOut !== null && p.daysUntilOut <= 14;
                const warn   = p.daysUntilOut !== null && p.daysUntilOut <= 30 && !urgent;
                return (
                  <tr key={p._id} className="hover:bg-panel transition-colors">
                    <td className="p-3 text-paper">{p.name}</td>
                    <td className="p-3 font-mono-tech">{p.stock}</td>
                    <td className="p-3 font-mono-tech text-paper-dim">{p.unitsPer30d}</td>
                    <td className="p-3 font-mono-tech text-paper-dim">{p.dailyRate}/day</td>
                    <td className={`p-3 font-mono-tech ${urgent ? "text-danger" : warn ? "text-flame" : "text-success"}`}>
                      {p.daysUntilOut !== null ? `${p.daysUntilOut}d` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer Lifetime Value */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-flame" />
          <SectionTitle>Top Customers by Lifetime Value</SectionTitle>
        </div>
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panel border-b border-hairline">
              <tr>
                {["Customer", "Country", "Orders", "Total spent", "Last order"].map((h) => (
                  <th key={h} className="text-left p-3 font-mono-tech text-xs text-steel uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {data.clv.map((c, i) => (
                <tr key={i} className="hover:bg-panel transition-colors">
                  <td className="p-3 text-paper font-mono-tech text-xs">{c._id}</td>
                  <td className="p-3 text-paper-dim">{c.country || "—"}</td>
                  <td className="p-3 font-mono-tech text-paper-dim">{c.orderCount}</td>
                  <td className="p-3 font-mono-tech text-flame">{formatPrice(c.totalCents)}</td>
                  <td className="p-3 text-steel text-xs">{new Date(c.lastOrderAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.clv.length === 0 && (
                <tr><td colSpan={5} className="p-5 text-center text-paper-dim text-sm">No paid orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
