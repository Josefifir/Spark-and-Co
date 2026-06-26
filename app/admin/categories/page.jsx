"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { toast } from "sonner";
import { csrfFetch } from "@/lib/auth/csrfFetch";

function CategoryFormModal({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    sortOrder: category?.sortOrder ?? 0,
    isActive: category?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => {
    const value =
      e.target.type === "checkbox"
        ? e.target.checked
        : e.target.type === "number"
        ? Number(e.target.value)
        : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = isEdit ? `/api/admin/categories/${category._id}` : "/api/admin/categories";
      const method = isEdit ? "PATCH" : "POST";

      const res = await csrfFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save category");
        setSubmitting(false);
        return;
      }

      toast.success(isEdit ? "Category updated" : "Category created");
      onSaved();
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <h2 className="font-display font-bold text-paper">
            {isEdit ? "Edit category" : "New category"}
          </h2>
          <button onClick={onClose} className="text-paper-dim hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Name" value={form.name} onChange={update("name")} required autoFocus />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={update("description")}
              rows={2}
              className="bg-graphite border border-hairline rounded-sm px-3.5 py-2.5 text-paper focus:border-flame transition-colors resize-none"
            />
          </div>

          <Input
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={update("sortOrder")}
          />

          <label className="flex items-center gap-2 text-sm text-paper-dim cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={update("isActive")} className="accent-flame" />
            Active (visible in store)
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create category"}
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await csrfFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Category deleted");
      load();
    } else {
      toast.error(data.error || "Failed to delete category");
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-2xl font-bold text-paper">Categories</h1>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Add category
        </Button>
      </div>
      <p className="text-sm text-paper-dim mb-8">
        Categories you create here show up immediately in the storefront nav, filters, and the
        product form — no code changes needed.
      </p>

      {loading ? (
        <p className="text-paper-dim">Loading...</p>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No categories yet. Add your first one — e.g. &quot;Torch&quot; or &quot;Refillable&quot;.
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider w-8"></th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Name</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Slug</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {categories.map((c) => (
                <tr key={c._id} className="hover:bg-panel transition-colors">
                  <td className="p-4 text-steel/40">
                    <GripVertical className="w-4 h-4" />
                  </td>
                  <td className="p-4 text-paper">{c.name}</td>
                  <td className="p-4 font-mono-tech text-paper-dim text-xs">{c.slug}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-sm border ${c.isActive ? "border-success/30 text-success" : "border-steel/30 text-steel"}`}>
                      {c.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditing(c); setModalOpen(true); }}
                        className="text-paper-dim hover:text-flame transition-colors p-1.5"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="text-paper-dim hover:text-danger transition-colors p-1.5"
                        aria-label={`Delete ${c.name}`}
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
        <CategoryFormModal
          category={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}