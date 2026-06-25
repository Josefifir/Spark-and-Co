"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";

const STATUS_COLORS = {
  paid: "text-success border-success/30",
  pending: "text-flame border-flame/30",
  failed: "text-danger border-danger/30",
  refunded: "text-steel border-steel/30",
  expired: "text-steel border-steel/30",
  cancelled: "text-steel border-steel/30",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const qs  = filter ? `?status=${filter}` : "";
      const res = await fetch(`/api/admin/orders/export${qs}`);
      if (!res.ok) { setExporting(false); return; }
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/orders${qs}`)
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-paper">Orders</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-xs font-mono-tech uppercase px-3 py-1.5 rounded-sm border border-hairline text-paper-dim hover:border-flame hover:text-flame transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "Exporting..." : `Export${filter ? " filtered" : " all"} CSV`}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "pending", "paid", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono-tech uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filter === s ? "border-flame text-flame bg-flame/5" : "border-hairline text-paper-dim hover:border-steel"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-paper-dim">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No orders found.
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Order</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Customer</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Total</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Payment</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Fulfillment</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-panel transition-colors cursor-pointer">
                  <td className="p-0">
                    <Link href={`/admin/orders/${o._id}`} className="block p-4 font-mono-tech text-paper">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-paper-dim">{o.customerEmail}</td>
                  <td className="p-4 font-mono-tech text-paper">{formatPrice(o.totalCents, o.currency)}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-sm border ${STATUS_COLORS[o.paymentStatus] || ""}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-paper-dim capitalize">{o.fulfillmentStatus}</td>
                  <td className="p-4 text-steel text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
