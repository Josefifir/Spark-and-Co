"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Copy, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils-shop";
import { generateDiscountCode } from "@/lib/utils-shop";
import { csrfFetch } from "@/lib/auth/csrfFetch";

function DiscountFormModal({ discount, onClose, onSaved }) {
  const isEdit = Boolean(discount);
  const [form, setForm] = useState({
    code: discount?.code || "",
    discountType: discount?.discountType || "percentage",
    discountValue: discount?.discountValue ?? 0,
    maxUsageCount: discount?.maxUsageCount || "",
    minimumOrderCents: discount?.minimumOrderCents ?? 0,
    expiresAt: discount?.expiresAt ? discount.expiresAt.split("T")[0] : "",
    isActive: discount?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => {
    let value = e.target.value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    } else if (e.target.type === "number") {
      value = value === "" ? "" : Number(value);
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleGenerateCode = () => {
    const newCode = generateDiscountCode(10);
    setForm((f) => ({ ...f, code: newCode }));
    toast.success(`Generated code: ${newCode}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minimumOrderCents: Number(form.minimumOrderCents),
        maxUsageCount: form.maxUsageCount ? Number(form.maxUsageCount) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt + "T23:59:59Z").toISOString() : null,
      };

      const url = isEdit ? `/api/admin/discounts/${discount._id}` : "/api/admin/discounts";
      const method = isEdit ? "PATCH" : "POST";

      const res = await csrfFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save discount code");
        setSubmitting(false);
        return;
      }

      toast.success(isEdit ? "Discount updated" : "Discount created");
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-hairline sticky top-0 bg-panel">
          <h2 className="font-display font-bold text-paper">
            {isEdit ? "Edit discount" : "New discount code"}
          </h2>
          <button onClick={onClose} className="text-paper-dim hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-2">
            <Input
              label="Code"
              value={form.code}
              onChange={update("code")}
              placeholder="e.g., SUMMER20"
              required
              autoFocus
              disabled={isEdit}
            />
            {!isEdit && (
              <div className="flex flex-col gap-1.5 pt-6">
                <Button type="button" onClick={handleGenerateCode} variant="secondary" size="sm">
                  <Copy className="w-3 h-3" /> Generate
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech mb-2 block">
                Type
              </label>
              <select
                value={form.discountType}
                onChange={update("discountType")}
                className="w-full bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed amount ($)</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                label="Value"
                type="number"
                min="0"
                max={form.discountType === "percentage" ? "100" : "999999"}
                step={form.discountType === "percentage" ? "1" : "100"}
                value={form.discountValue}
                onChange={update("discountValue")}
                placeholder={form.discountType === "percentage" ? "20" : "1000"}
                required
              />
            </div>
          </div>

          <Input
            label="Minimum order (cents, optional)"
            type="number"
            min="0"
            value={form.minimumOrderCents}
            onChange={update("minimumOrderCents")}
            placeholder="0"
          />

          <Input
            label="Max usage count (optional, leave blank for unlimited)"
            type="number"
            min="1"
            value={form.maxUsageCount}
            onChange={update("maxUsageCount")}
            placeholder="100"
          />

          <Input
            label="Expires at (optional)"
            type="date"
            value={form.expiresAt}
            onChange={update("expiresAt")}
          />

          <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={update("isActive")} className="accent-flame" />
            Active
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create discount"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/discounts")
      .then((r) => r.json())
      .then((data) => setDiscounts(data.discounts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, code) => {
    if (!confirm(`Delete discount code "${code}"?`)) return;
    const res = await csrfFetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Discount deleted");
      load();
    } else {
      toast.error(data.error || "Failed to delete discount");
    }
  };

  const formatDiscount = (type, value) => {
    return type === "percentage" ? `${value}% off` : `$${(value / 100).toFixed(2)} off`;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-2xl font-bold text-paper">Discount Codes</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" /> Add code
        </Button>
      </div>
      <p className="text-sm text-paper-dim mb-8">
        Create promo codes to offer discounts. Customers apply them at checkout. Codes can be limited by
        usage count, minimum order amount, and expiration date.
      </p>

      {loading ? (
        <p className="text-paper-dim">Loading...</p>
      ) : discounts.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No discount codes yet. Create your first one — e.g. &quot;WELCOME20&quot; or &quot;SUMMER50&quot;.
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Code</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Discount</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Usage</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Min order</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Expires</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {discounts.map((d) => (
                <tr key={d._id} className="hover:bg-panel transition-colors">
                  <td className="p-4 font-mono-tech font-medium text-flame">{d.code}</td>
                  <td className="p-4 text-paper">{formatDiscount(d.discountType, d.discountValue)}</td>
                  <td className="p-4 text-paper-dim">
                    {d.usageCount}
                    {d.maxUsageCount && `/${d.maxUsageCount}`}
                  </td>
                  <td className="p-4 text-paper-dim">{d.minimumOrderCents > 0 ? formatPrice(d.minimumOrderCents) : "—"}</td>
                  <td className="p-4 text-paper-dim text-xs">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-4">
                    {d.isExpired ? (
                      <span className="text-xs px-2 py-1 rounded-sm border border-danger/30 text-danger">
                        Expired
                      </span>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-sm border ${
                          d.isActive ? "border-success/30 text-success" : "border-steel/30 text-steel"
                        }`}
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditing(d);
                          setModalOpen(true);
                        }}
                        className="text-paper-dim hover:text-flame transition-colors p-1.5"
                        aria-label={`Edit ${d.code}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d._id, d.code)}
                        className="text-paper-dim hover:text-danger transition-colors p-1.5"
                        aria-label={`Delete ${d.code}`}
                      >
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

      {modalOpen && (
        <DiscountFormModal
          discount={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
