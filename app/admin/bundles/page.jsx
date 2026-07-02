"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Package, Pencil, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/auth/csrfFetch";
import { formatPrice } from "@/lib/utils-shop";

function BundleModal({ bundle, onClose, onSaved, products }) {
  const isEdit = Boolean(bundle);
  const [form, setForm] = useState({
    name: bundle?.name || "",
    slug: bundle?.slug || "",
    description: bundle?.description || "",
    discountType: bundle?.discountType || "percentage",
    discountValue: bundle?.discountValue != null ? bundle.discountValue : 10,
    image: bundle?.image || "",
    isActive: bundle?.isActive ?? true,
    items: bundle?.items?.map(i => ({
      product: i.product?._id || i.product,
      quantity: i.quantity,
    })) || [{ product: "", quantity: 1 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product: "", quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));
  const updateItem = (i, field, value) => setForm(f => ({
    ...f,
    items: f.items.map((item, j) => j === i ? { ...item, [field]: value } : item),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      discountValue: parseFloat(form.discountValue),
      items: form.items.filter(i => i.product).map(i => ({ ...i, quantity: parseInt(i.quantity, 10) })),
    };
    try {
      const url = isEdit ? `/api/admin/bundles/${bundle._id}` : "/api/admin/bundles";
      const method = isEdit ? "PATCH" : "POST";
      const res = await csrfFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to save bundle"); setSubmitting(false); return; }
      toast.success(isEdit ? "Bundle updated" : "Bundle created");
      onSaved();
    } catch { toast.error("Something went wrong"); setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-panel border border-hairline rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <h2 className="font-display font-bold text-paper">{isEdit ? "Edit bundle" : "New bundle"}</h2>
          <button onClick={onClose} className="text-paper-dim hover:text-paper"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Bundle name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label="Slug (URL-safe)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated if blank" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Discount type</label>
              <select
                value={form.discountType}
                onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed amount (cents)</option>
              </select>
            </div>
            <Input
              label={form.discountType === "percentage" ? "Discount %" : "Discount (cents)"}
              type="number"
              min="0"
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
              required
            />
          </div>
          <Input label="Override image URL (optional)" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />

          {/* Bundle items */}
          <div className="border border-hairline rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">Bundle items (min 2)</label>
              <Button type="button" size="sm" variant="secondary" onClick={addItem}><Plus className="w-3 h-3" /> Add</Button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-steel font-mono-tech">Product</label>
                  <select
                    value={item.product}
                    onChange={e => updateItem(i, "product", e.target.value)}
                    required
                    className="bg-graphite border border-hairline rounded-sm px-2 py-2 text-sm text-paper focus:border-flame transition-colors"
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name} — {formatPrice(p.priceCents)}</option>
                    ))}
                  </select>
                </div>
                <div className="w-16 flex flex-col gap-1">
                  <label className="text-[10px] uppercase text-steel font-mono-tech">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateItem(i, "quantity", e.target.value)}
                    className="bg-graphite border border-hairline rounded-sm px-2 py-2 text-sm text-paper focus:border-flame transition-colors text-center"
                  />
                </div>
                <button type="button" onClick={() => removeItem(i)} className="text-steel hover:text-danger p-1 mb-0.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-flame" />
            Active (visible in store)
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Saving…" : isEdit ? "Save changes" : "Create bundle"}</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | bundle object

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/bundles").then(r => r.json()),
      fetch("/api/admin/products").then(r => r.json()),
    ]).then(([bd, pd]) => {
      setBundles(bd.bundles || []);
      setProducts(pd.products || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete bundle "${name}"?`)) return;
    const res = await csrfFetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Bundle deleted"); load(); }
    else toast.error("Failed to delete bundle");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-flame" />
          <h1 className="font-display text-2xl font-bold text-paper">Bundle Deals</h1>
        </div>
        <Button onClick={() => setModal("new")}><Plus className="w-4 h-4" /> New bundle</Button>
      </div>

      {loading ? (
        <p className="text-paper-dim">Loading…</p>
      ) : bundles.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No bundles yet. Create a bundle deal to increase average order value.
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                {["Bundle", "Items", "Discount", "Status", ""].map(h => (
                  <th key={h} className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {bundles.map(b => (
                <tr key={b._id} className="hover:bg-panel transition-colors">
                  <td className="p-4 text-paper font-medium">{b.name}</td>
                  <td className="p-4 text-paper-dim">{b.items?.length || 0} products</td>
                  <td className="p-4 font-mono-tech text-flame">
                    {b.discountType === "percentage" ? `${b.discountValue}%` : `$${(b.discountValue / 100).toFixed(2)}`} off
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-sm border ${b.isActive ? "border-success/30 text-success" : "border-steel/30 text-steel"}`}>
                      {b.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setModal(b)} className="text-paper-dim hover:text-flame p-1.5" aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b._id, b.name)} className="text-paper-dim hover:text-danger p-1.5" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BundleModal
          bundle={modal === "new" ? null : modal}
          products={products}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
