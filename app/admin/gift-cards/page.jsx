"use client";

import { useEffect, useState } from "react";
import { Gift, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils-shop";
import { csrfFetch } from "@/lib/auth/csrfFetch";

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ balance: "", expiresAt: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/gift-cards")
      .then((r) => r.json())
      .then((d) => setCards(d.cards || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await csrfFetch("/api/admin/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        balanceCents: Math.round(parseFloat(form.balance) * 100),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Gift card created: ${data.card.code}`);
      setShowForm(false);
      setForm({ balance: "", expiresAt: "" });
      load();
    } else {
      toast.error(data.error || "Failed to create gift card");
    }
    setSubmitting(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Gift className="w-5 h-5 text-flame" />
          <h1 className="font-display text-2xl font-bold text-paper">Gift Cards</h1>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" /> Generate gift card
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-panel border border-hairline rounded-sm p-5 space-y-4 mb-6">
          <h3 className="font-semibold text-paper">New Gift Card</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Balance (USD)"
              type="number"
              step="0.01"
              min="1"
              value={form.balance}
              onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Creating…" : "Generate"}</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {loading ? <p className="text-paper-dim">Loading…</p> : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-panel border-b border-hairline">
              <tr>
                {["Code", "Balance", "Remaining", "Expires", "Active"].map((h) => (
                  <th key={h} className="text-left p-3 font-mono-tech text-xs text-steel uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {cards.length === 0 ? (
                <tr><td colSpan={5} className="p-5 text-center text-paper-dim text-sm">No gift cards yet.</td></tr>
              ) : cards.map((c) => (
                <tr key={c._id} className="hover:bg-panel transition-colors">
                  <td className="p-3 font-mono-tech text-paper flex items-center gap-2">
                    {c.code}
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}
                      className="text-steel hover:text-flame"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="p-3 font-mono-tech text-steel">{formatPrice(c.discountValue)}</td>
                  <td className="p-3 font-mono-tech text-paper">{c.remainingBalanceCents !== null ? formatPrice(c.remainingBalanceCents) : formatPrice(c.discountValue)}</td>
                  <td className="p-3 text-paper-dim text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-sm border ${c.isActive ? "border-success/30 text-success" : "border-steel/30 text-steel"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
