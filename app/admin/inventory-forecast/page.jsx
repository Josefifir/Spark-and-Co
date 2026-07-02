"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingDown, Package } from "lucide-react";

export default function AdminInventoryForecastPage() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/inventory-forecast")
      .then((r) => r.json())
      .then((d) => setForecast(d.forecast))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <TrendingDown className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Inventory Forecast</h1>
      </div>

      {loading && <p className="text-steel text-sm">Loading…</p>}

      {forecast && (
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-4 px-4 pb-2 text-xs font-mono-tech text-steel uppercase tracking-wider">
            <div className="col-span-2">Product</div>
            <div className="text-right">Stock</div>
            <div className="text-right">Sold (30d)</div>
            <div className="text-right">Daily rate</div>
            <div className="text-right">Days left</div>
          </div>

          {forecast.map((p) => {
            const urgent = p.daysUntilStockout !== null && p.daysUntilStockout <= 14;
            const warning = p.daysUntilStockout !== null && p.daysUntilStockout <= 30 && !urgent;
            return (
              <div
                key={p._id}
                className={`grid grid-cols-6 gap-4 px-4 py-3 rounded-sm border text-sm ${
                  urgent ? "border-danger/40 bg-danger/5" :
                  warning ? "border-flame/30 bg-flame/5" :
                  "border-hairline"
                }`}
              >
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  {urgent && <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />}
                  {warning && <AlertTriangle className="w-3.5 h-3.5 text-flame shrink-0" />}
                  {!urgent && !warning && <Package className="w-3.5 h-3.5 text-steel shrink-0" />}
                  <Link href={`/admin/products`} className="text-paper hover:text-flame truncate">
                    {p.name}
                  </Link>
                </div>
                <div className="text-right font-mono-tech text-paper">{p.stock}</div>
                <div className="text-right text-paper-dim">{p.sold30d}</div>
                <div className="text-right text-paper-dim">{p.dailyRate}/day</div>
                <div className={`text-right font-mono-tech font-medium ${
                  urgent ? "text-danger" : warning ? "text-flame" : "text-steel"
                }`}>
                  {p.daysUntilStockout === null ? "∞" : `${p.daysUntilStockout}d`}
                </div>
              </div>
            );
          })}

          {forecast.length === 0 && (
            <p className="text-steel text-sm text-center py-8">No products found.</p>
          )}
        </div>
      )}
    </div>
  );
}
