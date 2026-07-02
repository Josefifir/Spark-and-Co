"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, CheckSquare, Square, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import { csrfFetch } from "@/lib/auth/csrfFetch";
import { toast } from "sonner";

const STATUS_COLORS = {
  paid: "text-success border-success/30",
  pending: "text-flame border-flame/30",
  failed: "text-danger border-danger/30",
  refunded: "text-steel border-steel/30",
  expired: "text-steel border-steel/30",
  cancelled: "text-steel border-steel/30",
};

const FULFILLMENT_COLORS = {
  unfulfilled: "text-flame",
  processing: "text-paper-dim",
  shipped: "text-success",
  delivered: "text-success",
  cancelled: "text-steel",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("shipped");
  const [bulking, setBulking] = useState(false);

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

  async function handleBulkFulfill() {
    if (selected.size === 0) return;
    if (!confirm(`Mark ${selected.size} orders as "${bulkStatus}"?`)) return;
    setBulking(true);
    try {
      const res = await csrfFetch("/api/admin/orders/bulk-fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [...selected], fulfillmentStatus: bulkStatus }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Bulk update failed"); return; }
      toast.success(`${data.updated} orders updated to "${bulkStatus}"`);
      setSelected(new Set());
      load();
    } catch { toast.error("Something went wrong"); }
    finally { setBulking(false); }
  }

  function load() {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/orders${qs}`)
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === orders.length) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o._id)));
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
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

      {/* Filters */}
      <div className="flex gap-2 mb-4">
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

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-panel border border-flame/30 rounded-sm px-4 py-3">
          <Truck className="w-4 h-4 text-flame" />
          <span className="text-sm text-paper">{selected.size} order{selected.size > 1 ? "s" : ""} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="bg-graphite border border-hairline rounded-sm px-2 py-1 text-sm text-paper focus:border-flame transition-colors"
          >
            <option value="processing">Mark as processing</option>
            <option value="shipped">Mark as shipped</option>
            <option value="delivered">Mark as delivered</option>
            <option value="cancelled">Mark as cancelled</option>
          </select>
          <button
            onClick={handleBulkFulfill}
            disabled={bulking}
            className="text-xs bg-flame text-graphite font-medium px-3 py-1.5 rounded-sm hover:bg-flame-bright transition-colors disabled:opacity-50"
          >
            {bulking ? "Updating…" : "Apply"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-steel hover:text-paper ml-auto">
            Clear selection
          </button>
        </div>
      )}

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
                <th className="p-4 w-10">
                  <button onClick={toggleAll} className="text-steel hover:text-paper">
                    {selected.size === orders.length ? <CheckSquare className="w-4 h-4 text-flame" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
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
                <tr key={o._id} className={`hover:bg-panel transition-colors ${selected.has(o._id) ? "bg-flame/5" : ""}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelect(o._id)} className="text-steel hover:text-paper">
                      {selected.has(o._id) ? <CheckSquare className="w-4 h-4 text-flame" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
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
                  <td className={`p-4 capitalize text-sm ${FULFILLMENT_COLORS[o.fulfillmentStatus] || "text-paper-dim"}`}>
                    {o.fulfillmentStatus}
                  </td>
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
