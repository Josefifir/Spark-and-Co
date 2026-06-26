"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Flame, Upload } from "lucide-react";
import { formatPrice } from "@/lib/utils-shop";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import ProductFormModal from "@/components/admin/ProductFormModal";
import CsvImportModal from "@/components/admin/CsvImportModal";
import { csrfFetch } from "@/lib/auth/csrfFetch";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await csrfFetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      load();
    } else {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-paper">Products</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Add product
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-paper-dim">Loading...</p>
      ) : products.length === 0 ? (
        <div className="border border-dashed border-hairline rounded-sm p-16 text-center text-paper-dim">
          No products yet. Add your first lighter to the catalog.
        </div>
      ) : (
        <div className="border border-hairline rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Product</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Category</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Price</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Stock</th>
                <th className="p-4 font-mono-tech text-xs text-steel uppercase tracking-wider">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-panel transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-panel-raised rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Flame className="w-4 h-4 text-steel/40" />
                        )}
                      </div>
                      <div>
                        <span className="text-paper">{p.name}</span>
                        <p className="text-xs text-steel font-mono-tech">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-paper-dim capitalize">{p.category}</td>
                  <td className="p-4 font-mono-tech text-paper">{formatPrice(p.priceCents)}</td>
                  <td className="p-4 font-mono-tech text-paper-dim">{p.stock}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-sm border ${p.isActive ? "border-success/30 text-success" : "border-steel/30 text-steel"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setEditing(p); setModalOpen(true); }}
                        className="text-paper-dim hover:text-flame transition-colors p-1.5"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id, p.name)}
                        className="text-paper-dim hover:text-danger transition-colors p-1.5"
                        aria-label={`Delete ${p.name}`}
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
        <ProductFormModal
          product={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}

      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => { load(); }}
        />
      )}
    </div>
  );
}
