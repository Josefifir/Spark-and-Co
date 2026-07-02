"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ChevronRight } from "lucide-react";
import { useCurrency } from "@/lib/currency/CurrencyContext";

const COMPARE_KEY = "compare-products";
const MAX_COMPARE = 3;

// ── Shared context ────────────────────────────────────────────────────────────

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]")); } catch {}
  }, []);

  const add = useCallback((product) => {
    setItems((prev) => {
      if (prev.find((p) => p._id === product._id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        priceCents: product.priceCents,
        images: product.images,
        specs: product.specs,
        category: product.category,
      }];
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((p) => p._id !== id);
      localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem(COMPARE_KEY);
  }, []);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

// ── Public components ─────────────────────────────────────────────────────────

export function CompareButton({ product }) {
  const { items, add, remove } = useCompare();
  const inList = items.find((p) => p._id === product._id);

  return (
    <button
      type="button"
      onClick={() => inList ? remove(product._id) : add(product)}
      className={`h-9 px-3 text-xs border rounded-sm transition-colors ${
        inList
          ? "border-flame text-flame bg-flame/5"
          : "border-hairline text-steel hover:border-steel hover:text-paper"
      }`}
    >
      {inList ? "✓ Comparing" : "+ Compare"}
    </button>
  );
}

export function CompareBar() {
  const { items, remove, clear } = useCompare();
  const { formatPrice } = useCurrency();
  const [modalOpen, setModalOpen] = useState(false);

  if (items.length < 2) return null;

  const specKeys = [...new Set(items.flatMap((p) => (p.specs || []).map((s) => s.label)))];

  return (
    <>
      {/* Sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-hairline shadow-2xl py-3 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono-tech text-steel uppercase tracking-wider mr-2">Compare</span>
          {items.map((p) => (
            <div key={p._id} className="flex items-center gap-1.5 bg-panel-raised border border-hairline rounded-sm px-2 py-1">
              <span className="text-xs text-paper truncate max-w-[120px]">{p.name}</span>
              <button onClick={() => remove(p._id)} className="text-steel hover:text-paper">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setModalOpen(true)}
            className="ml-auto text-xs bg-flame text-graphite font-semibold px-4 py-2 rounded-sm hover:bg-flame-bright transition-colors flex items-center gap-1"
          >
            Compare <ChevronRight className="w-3 h-3" />
          </button>
          <button onClick={clear} className="text-xs text-steel hover:text-paper">Clear</button>
        </div>
      </div>

      {/* Comparison modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto bg-panel border border-hairline rounded-sm">
            <div className="flex items-center justify-between p-5 border-b border-hairline">
              <h2 className="font-display text-xl font-bold text-paper">Product comparison</h2>
              <button onClick={() => setModalOpen(false)} className="text-steel hover:text-paper">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-mono-tech text-steel uppercase p-4 w-32">Feature</th>
                    {items.map((p) => (
                      <th key={p._id} className="p-4 text-left">
                        <div className="w-24 h-24 bg-panel-raised border border-hairline rounded-sm overflow-hidden relative mb-2">
                          {p.images?.[0] && (
                            <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="96px" />
                          )}
                        </div>
                        <Link href={`/products/${p.slug}`} className="text-paper font-medium hover:text-flame transition-colors block">
                          {p.name}
                        </Link>
                        <p className="font-mono-tech text-flame mt-1">{formatPrice(p.priceCents)}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-hairline">
                    <td className="p-4 text-xs font-mono-tech text-steel uppercase">Category</td>
                    {items.map((p) => (
                      <td key={p._id} className="p-4 text-paper-dim">{p.category}</td>
                    ))}
                  </tr>
                  {specKeys.map((key) => (
                    <tr key={key} className="border-t border-hairline">
                      <td className="p-4 text-xs font-mono-tech text-steel uppercase">{key}</td>
                      {items.map((p) => {
                        const spec = (p.specs || []).find((s) => s.label === key);
                        return <td key={p._id} className="p-4 text-paper-dim">{spec?.value || "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
