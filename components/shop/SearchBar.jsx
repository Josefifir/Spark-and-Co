"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Flame } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency/CurrencyContext";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const { formatPrice } = useCurrency();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center border border-hairline rounded-sm bg-graphite px-3 gap-2 w-48 focus-within:border-flame transition-colors">
        <Search className="w-3.5 h-3.5 text-steel shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search…"
          className="bg-transparent text-sm text-paper placeholder:text-steel outline-none py-1.5 w-full"
          aria-label="Search products"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-steel hover:text-paper">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-full right-0 mt-1 w-72 bg-panel border border-hairline rounded-sm shadow-lg z-50 overflow-hidden">
          {loading ? (
            <p className="text-xs text-steel px-3 py-3">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-steel px-3 py-3">No results for "{query}"</p>
          ) : (
            <>
              {results.map((p) => (
                <Link
                  key={p._id}
                  href={`/products/${p.slug}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-graphite transition-colors"
                >
                  <div className="w-8 h-8 rounded-sm bg-graphite overflow-hidden shrink-0 flex items-center justify-center">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Flame className="w-3.5 h-3.5 text-steel/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-paper truncate">{p.name}</p>
                    <p className="text-xs font-mono-tech text-steel">{formatPrice(p.priceCents, "USD")}</p>
                  </div>
                </Link>
              ))}
              <Link
                href={`/products?q=${encodeURIComponent(query)}`}
                onClick={() => { setOpen(false); setQuery(""); }}
                className="block text-xs text-flame px-3 py-2.5 border-t border-hairline hover:bg-graphite transition-colors"
              >
                See all results for "{query}" →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
