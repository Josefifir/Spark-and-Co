"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ImageUploader from "@/components/admin/ImageUploader";
import { toast } from "sonner";

export default function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product ? (product.priceCents / 100).toFixed(2) : "",
    category: product?.category || "",
    stock: product?.stock ?? 0,
    sku: product?.sku || "",
    images: product?.images || [],
    isActive: product?.isActive ?? true,
    featured: product?.featured ?? false,
    bulkPricingTiers: product?.bulkPricingTiers || [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.categories || []).filter((c) => c.isActive);
        setCategories(active);
        // Default to the first available category if none is set yet
        setForm((f) => (f.category ? f : { ...f, category: active[0]?.slug || "" }));
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const addBulkTier = () => {
    setForm((f) => ({
      ...f,
      bulkPricingTiers: [...f.bulkPricingTiers, { minQuantity: 3, discountPercent: 10 }],
    }));
  };

  const removeBulkTier = (index) => {
    setForm((f) => ({
      ...f,
      bulkPricingTiers: f.bulkPricingTiers.filter((_, i) => i !== index),
    }));
  };

  const updateBulkTier = (index, field, value) => {
    setForm((f) => ({
      ...f,
      bulkPricingTiers: f.bulkPricingTiers.map((tier, i) =>
        i === index ? { ...tier, [field]: parseInt(value) || 0 } : tier
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      description: form.description,
      priceCents: Math.round(parseFloat(form.price) * 100),
      category: form.category,
      stock: parseInt(form.stock, 10),
      sku: form.sku,
      images: form.images,
      isActive: form.isActive,
      featured: form.featured,
      bulkPricingTiers: form.bulkPricingTiers,
    };

    try {
      const url = isEdit ? `/api/admin/products/${product._id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save product");
        setSubmitting(false);
        return;
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <h2 className="font-display font-bold text-paper">
            {isEdit ? "Edit product" : "New product"}
          </h2>
          <button onClick={onClose} className="text-paper-dim hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Name" value={form.name} onChange={update("name")} required />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={update("description")}
              required
              rows={3}
              className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (USD)" type="number" step="0.01" min="0" value={form.price} onChange={update("price")} required />
            <Input label="Stock" type="number" min="0" value={form.stock} onChange={update("stock")} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={update("sku")} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Category
              </label>
              {loadingCategories ? (
                <div className="text-sm text-steel py-2.5">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-xs text-paper-dim py-2">
                  No categories yet.{" "}
                  <Link href="/admin/categories" className="text-flame hover:text-flame-bright underline">
                    Create one first →
                  </Link>
                </div>
              ) : (
                <select
                  value={form.category}
                  onChange={update("category")}
                  required
                  className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <ImageUploader
            images={form.images}
            onChange={(images) => setForm((f) => ({ ...f, images }))}
          />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={update("isActive")} className="accent-flame" />
              Active (visible in store)
            </label>
            <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
              <input type="checkbox" checked={form.featured} onChange={update("featured")} className="accent-flame" />
              Featured
            </label>
          </div>

          {/* Bulk Pricing Section */}
          <div className="border border-hairline rounded-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
                Bulk Pricing Tiers (Optional)
              </label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addBulkTier}
              >
                <Plus className="w-3 h-3" /> Add Tier
              </Button>
            </div>
            
            {form.bulkPricingTiers.length === 0 ? (
              <p className="text-xs text-steel">
                No bulk pricing tiers. Add tiers to offer discounts for larger quantities (e.g., "Buy 3+ get 10% off").
              </p>
            ) : (
              <div className="space-y-2">
                {form.bulkPricingTiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-2 bg-graphite p-2 rounded-sm">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-steel font-mono-tech">
                          Min Qty
                        </label>
                        <input
                          type="number"
                          min="2"
                          value={tier.minQuantity}
                          onChange={(e) => updateBulkTier(index, "minQuantity", e.target.value)}
                          className="bg-panel border border-hairline rounded-sm px-2 py-1 text-sm text-paper focus:border-flame transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-steel font-mono-tech">
                          Discount %
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={tier.discountPercent}
                          onChange={(e) => updateBulkTier(index, "discountPercent", e.target.value)}
                          className="bg-panel border border-hairline rounded-sm px-2 py-1 text-sm text-paper focus:border-flame transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBulkTier(index)}
                      className="text-steel hover:text-danger transition-colors p-1"
                      aria-label="Remove tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-steel mt-2">
                  Example: Min Qty 3, Discount 10% = "Buy 3+ get 10% off"
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting || categories.length === 0} className="flex-1">
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}
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