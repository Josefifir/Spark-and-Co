"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (pg = 1, query = q) => {
    setLoading(true);
    fetch(`/api/admin/customers?page=${pg}&q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
        setTotal(d.total || 0);
        setPage(d.page || 1);
        setPages(d.pages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    load(1, q);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-flame" />
          <h1 className="font-display text-2xl font-bold text-paper">Customers</h1>
          <span className="text-steel text-sm">({total})</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-panel border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame transition-colors"
        />
        <button type="submit" className="px-4 py-2 bg-flame text-graphite text-sm font-semibold rounded-sm hover:bg-flame-bright transition-colors">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-steel text-sm">Loading…</p>
      ) : (
        <>
          <div className="border border-hairline rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-panel/60">
                  <th className="text-left px-4 py-3 text-xs font-mono-tech text-steel uppercase">Customer</th>
                  <th className="text-right px-4 py-3 text-xs font-mono-tech text-steel uppercase">Orders</th>
                  <th className="text-right px-4 py-3 text-xs font-mono-tech text-steel uppercase">Total Spent</th>
                  <th className="text-right px-4 py-3 text-xs font-mono-tech text-steel uppercase">Last Order</th>
                  <th className="text-right px-4 py-3 text-xs font-mono-tech text-steel uppercase">Points</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} className="border-b border-hairline hover:bg-panel/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-paper font-medium">{c.firstName} {c.lastName}</p>
                      <p className="text-steel text-xs">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono-tech text-paper">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-mono-tech text-flame font-medium">
                      {c.totalSpentCents > 0 ? formatPrice(c.totalSpentCents) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-steel text-xs">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-paper-dim">{c.loyaltyPoints ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => load(i + 1)}
                  className={`w-8 h-8 text-sm rounded-sm border transition-colors ${page === i + 1 ? "border-flame bg-flame/10 text-flame" : "border-hairline text-steel hover:text-paper"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
