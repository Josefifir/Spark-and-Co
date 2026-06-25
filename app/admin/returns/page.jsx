"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils-shop";
import Button from "@/components/ui/Button";

const STATUS_COLORS = {
  requested: "text-flame border-flame/30",
  approved: "text-success border-success/30",
  rejected: "text-danger border-danger/30",
  label_sent: "text-steel border-steel/30",
  received: "text-steel border-steel/30",
  refunded: "text-success border-success/30",
};

const STATUSES = ["requested", "approved", "rejected", "label_sent", "received", "refunded"];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null); // { id, status, adminNote, returnLabelUrl, refundAmountCents }

  const load = () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    fetch(`/api/admin/returns${qs}`)
      .then((r) => r.json())
      .then((d) => setReturns(d.returns || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/returns/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editing.status,
        adminNote: editing.adminNote,
        returnLabelUrl: editing.returnLabelUrl || undefined,
        refundAmountCents: editing.refundAmountCents ? parseInt(editing.refundAmountCents) : undefined,
      }),
    });
    if (res.ok) { toast.success("Return updated"); setEditing(null); load(); }
    else toast.error("Failed to update");
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <RotateCcw className="w-5 h-5 text-flame" />
        <h1 className="font-display text-2xl font-bold text-paper">Returns / RMA</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["", ...STATUSES].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`text-xs font-mono-tech uppercase px-3 py-1.5 rounded-sm border transition-colors ${
              filter === s ? "border-flame text-flame bg-flame/5" : "border-hairline text-paper-dim hover:border-steel"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <p className="text-paper-dim">Loading…</p> : returns.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-12 text-center text-paper-dim text-sm">
          No return requests.
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <div key={r._id} className="border border-hairline rounded-sm p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono-tech text-sm text-paper">{r.orderNumber}</p>
                  <p className="text-xs text-steel mt-0.5">{r.customerEmail} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-sm border ${STATUS_COLORS[r.status] || ""}`}>
                  {r.status}
                </span>
              </div>

              <div className="space-y-1">
                {r.items.map((item, i) => (
                  <p key={i} className="text-sm text-paper-dim">
                    <span className="text-paper">{item.quantity}x {item.productName}</span> — {item.reason}
                  </p>
                ))}
              </div>

              {r.adminNote && (
                <p className="text-xs text-steel border-t border-hairline pt-2">Note: {r.adminNote}</p>
              )}

              {editing?.id === r._id ? (
                <div className="border-t border-hairline pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-steel uppercase font-mono-tech">Status</label>
                      <select
                        value={editing.status}
                        onChange={(e) => setEditing((v) => ({ ...v, status: e.target.value }))}
                        className="bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-steel uppercase font-mono-tech">Refund (cents)</label>
                      <input
                        type="number"
                        value={editing.refundAmountCents}
                        onChange={(e) => setEditing((v) => ({ ...v, refundAmountCents: e.target.value }))}
                        className="bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame"
                        placeholder="e.g. 4999 = $49.99"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-steel uppercase font-mono-tech">Return label URL</label>
                    <input
                      type="url"
                      value={editing.returnLabelUrl}
                      onChange={(e) => setEditing((v) => ({ ...v, returnLabelUrl: e.target.value }))}
                      placeholder="https://dhl.de/label/..."
                      className="bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame"
                    />
                  </div>
                  <textarea
                    value={editing.adminNote}
                    onChange={(e) => setEditing((v) => ({ ...v, adminNote: e.target.value }))}
                    rows={2}
                    placeholder="Internal note…"
                    className="w-full bg-graphite border border-hairline rounded-sm px-3 py-2 text-paper text-sm focus:border-flame resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdate}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditing({ id: r._id, status: r.status, adminNote: r.adminNote || "", returnLabelUrl: r.returnLabelUrl || "", refundAmountCents: r.refundAmountCents || "" })}
                  className="text-xs text-flame hover:text-flame-bright flex items-center gap-1"
                >
                  <ChevronDown className="w-3.5 h-3.5" /> Update status
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
