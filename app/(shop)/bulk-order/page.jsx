"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, AlertCircle, ShoppingCart, TrendingDown } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/components/shop/CartContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { toast } from "sonner";

const TEMPLATE = "sku,quantity\nSKU-001,5\nSKU-002,10";

export default function BulkOrderPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const { addItem, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState(null); // { valid, errors, totalRows }
  const [parseError, setParseError] = useState(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bulk-order-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setResult(null);
    setParseError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/bulk-order/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error || "Parse failed"); return; }
      setResult(data);
    } catch { setParseError("Something went wrong"); }
    finally { setParsing(false); }
  }

  function handleAddToCart() {
    if (!result?.valid?.length) return;
    clearCart();
    for (const item of result.valid) {
      addItem({ _id: item.productId, name: item.name, slug: item.slug, priceCents: item.priceCents, images: item.image ? [item.image] : [] }, item.quantity);
    }
    toast.success(`${result.valid.length} product${result.valid.length !== 1 ? "s" : ""} added to cart`);
    router.push("/cart");
  }

  const totalCents = result?.valid?.reduce((sum, i) => sum + i.priceCents * i.quantity, 0) || 0;
  const hasSavings = result?.valid?.some((i) => i.bulkApplied);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-paper mb-2">Bulk Order Upload</h1>
      <p className="text-paper-dim text-sm mb-8">Upload a CSV with SKU and quantity to add multiple products to your cart at once. Bulk pricing is applied automatically.</p>

      {/* Template */}
      <div className="bg-panel border border-hairline rounded-sm p-4 mb-6">
        <p className="text-sm text-paper-dim mb-2">Your CSV must have two columns: <code className="text-paper font-mono-tech">sku</code> and <code className="text-paper font-mono-tech">quantity</code>.</p>
        <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-flame hover:text-flame-bright transition-colors">
          <Download className="w-3.5 h-3.5" /> Download template
        </button>
      </div>

      {/* Upload */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-hairline rounded-sm p-10 text-center cursor-pointer hover:border-flame transition-colors mb-4"
      >
        <Upload className="w-5 h-5 text-steel mx-auto mb-2" />
        {file ? <p className="text-sm text-paper">{file.name}</p> : <p className="text-sm text-paper-dim">Click to select a CSV file</p>}
        <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setParseError(null); }} />
      </div>

      <div className="flex gap-3 mb-8">
        <Button onClick={handleParse} disabled={!file || parsing} className="flex-1">
          {parsing ? "Parsing…" : "Validate & Preview"}
        </Button>
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-danger text-sm mb-6"><AlertCircle className="w-4 h-4 shrink-0" />{parseError}</div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="border border-danger/30 rounded-sm overflow-hidden">
              <div className="bg-danger/5 px-4 py-2 border-b border-danger/20">
                <p className="text-xs font-mono-tech text-danger uppercase tracking-wider">{result.errors.length} row{result.errors.length !== 1 ? "s" : ""} skipped</p>
              </div>
              <div className="divide-y divide-hairline max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="px-4 py-2 text-xs font-mono-tech text-danger">Row {e.row}{e.sku ? ` (${e.sku})` : ""}: {e.error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Valid items preview */}
          {result.valid.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono-tech text-steel uppercase tracking-wider">{result.valid.length} valid item{result.valid.length !== 1 ? "s" : ""}</p>
                {hasSavings && (
                  <span className="flex items-center gap-1 text-xs text-flame"><TrendingDown className="w-3.5 h-3.5" /> Bulk pricing applied</span>
                )}
              </div>
              <div className="border border-hairline rounded-sm overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-panel border-b border-hairline">
                    <tr>
                      {["SKU", "Product", "Qty", "Unit Price", "Line Total"].map((h) => (
                        <th key={h} className="text-left p-3 text-xs font-mono-tech text-steel uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {result.valid.map((item) => (
                      <tr key={item.productId} className="hover:bg-panel transition-colors">
                        <td className="p-3 font-mono-tech text-xs text-steel">{item.sku}</td>
                        <td className="p-3 text-paper">{item.name}</td>
                        <td className="p-3 font-mono-tech text-paper">{item.quantity}</td>
                        <td className="p-3 font-mono-tech text-paper">
                          {formatPrice(item.priceCents)}
                          {item.bulkApplied && <span className="ml-1.5 text-xs text-flame">-{item.discountPercent}%</span>}
                        </td>
                        <td className="p-3 font-mono-tech text-flame">{formatPrice(item.priceCents * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 bg-panel border border-hairline rounded-sm mb-4">
                <span className="text-paper font-medium">Estimated total</span>
                <span className="font-mono-tech text-flame font-bold text-lg">{formatPrice(totalCents)}</span>
              </div>
              <Button size="lg" onClick={handleAddToCart} className="w-full flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Add all to cart & continue
              </Button>
            </div>
          )}

          {result.valid.length === 0 && result.errors.length > 0 && (
            <div className="flex items-center gap-2 text-paper-dim text-sm"><AlertCircle className="w-4 h-4 text-danger" /> No valid rows found. Please fix the errors and re-upload.</div>
          )}
        </div>
      )}
    </div>
  );
}
