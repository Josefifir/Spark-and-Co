"use client";

import { useEffect, useState } from "react";
import { BarChart2, Users, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";

function SectionTitle({ children }) {
  return <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">{children}</h2>;
}

function RevenueChart({ days }) {
  const maxRevenue = Math.max(...days.map(d => d.revenue), 1);
  const width = 640;
  const height = 160;
  const padding = { top: 16, right: 8, bottom: 32, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const n = days.length;

  const x = (i) => padding.left + (i / (n - 1)) * chartW;
  const y = (v) => padding.top + chartH - (v / maxRevenue) * chartH;

  const points = days.map((d, i) => `${x(i)},${y(d.revenue)}`).join(" ");
  const area = `${padding.left},${padding.top + chartH} ` + days.map((d, i) => `${x(i)},${y(d.revenue)}`).join(" ") + ` ${x(n - 1)},${padding.top + chartH}`;

  // X-axis labels: show first, last, and every ~7 days
  const xLabels = days
    .map((d, i) => ({ i, d }))
    .filter(({ i }) => i === 0 || i === n - 1 || i % Math.max(1, Math.floor(n / 6)) === 0);

  // Y-axis: 4 steps
  const ySteps = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    v: maxRevenue * f,
    y: y(maxRevenue * f),
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 200 }}>
      {/* Grid lines */}
      {ySteps.map((s, i) => (
        <g key={i}>
          <line x1={padding.left} y1={s.y} x2={padding.left + chartW} y2={s.y} stroke="#2d2d2d" strokeWidth="1" />
          <text x={padding.left - 6} y={s.y + 4} textAnchor="end" fontSize="10" fill="#6b7280">
            {s.v >= 100 ? `$${(s.v / 100).toFixed(0)}` : ""}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={area} fill="rgba(249,115,22,0.08)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* X-axis labels */}
      {xLabels.map(({ i, d }) => (
        <text key={i} x={x(i)} y={height - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
          {d.date.slice(5)} {/* MM-DD */}
        </text>
      ))}
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(30);
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setChartLoading(true);
    fetch(`/api/admin/revenue-chart?days=${chartDays}`)
      .then(r => r.json())
      .then(d => { setChartData(d.days); setChartLoading(false); })
      .catch(() => setChartLoading(false));
  }, [chartDays]);

  if (loading) return <div className="p-8"><p className="text-paper-dim">Loading analytics…</p></div>;
  if (!data) return <div className="p-8"><p className="text-danger">Failed to load analytics.</p></div>;

  const critical = data.forecast.filter((p) => p.daysUntilOut !== null && p.daysUntilOut <= 14);

  const totalRevenue = chartData?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const totalOrders = chartData?.reduce((sum, d) => sum + d.orders, 0) || 0;

  return (
    <div className="p-8 space-y-12">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Analytics</h1>
      </div>

      {/* Revenue over time chart */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Revenue Over Time</SectionTitle>
          <div className="flex gap-1">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setChartDays(d)}
                className={`text-xs font-mono-tech px-2.5 py-1 rounded-sm border transition-colors ${
                  chartDays === d ? "border-flame text-flame bg-flame/5" : "border-hairline text-paper-dim hover:border-steel"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="border border-hairline rounded-sm p-4">
          <div className="flex gap-8 mb-4">
            <div>
              <p className="text-xs font-mono-tech text-steel uppercase tracking-wider">Revenue</p>
              <p className="font-display text-xl font-bold text-flame">{formatPrice(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs font-mono-tech text-steel uppercase tracking-wider">Orders</p>
              <p className="font-display text-xl font-bold text-paper">{totalOrders}</p>
            </div>
          </div>
          {chartLoading ? (
            <div className="h-40 flex items-center justify-center text-paper-dim text-sm">Loading…</div>
          ) : chartData ? (
            <RevenueChart days={chartData} />
          ) : null}
        </div>
      </section>

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
