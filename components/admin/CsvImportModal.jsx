"use client";

import { useRef, useState } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { csrfFetch } from "@/lib/auth/csrfFetch";

const TEMPLATE_HEADERS = "name,sku,price,stock,category,description,isActive,featured,ageRestricted";
const TEMPLATE_EXAMPLE = 'Zippo Classic,ZIPPO-001,12.99,50,classic,"A reliable windproof lighter",true,false,true';

export default function CsvImportModal({ onClose, onImported }) {
  const inputRef  = useRef(null);
  const [file, setFile]         = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult]     = useState(null); // { created, updated, errors, total }
  const [error, setError]       = useState(null);

  function downloadTemplate() {
    const csv  = TEMPLATE_HEADERS + "\n" + TEMPLATE_EXAMPLE;
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res  = await csrfFetch("/api/admin/products/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed.");
        setImporting(false);
        return;
      }
      setResult(data);
      if (data.created > 0 || data.updated > 0) onImported();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-panel border border-hairline rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-hairline">
          <h2 className="font-display font-bold text-paper">Import products via CSV</h2>
          <button onClick={onClose} className="text-paper-dim hover:text-paper">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Template download */}
          <div className="bg-graphite border border-hairline rounded-sm p-4 space-y-2">
            <p className="text-sm text-paper-dim">
              Upload a <span className="text-paper font-medium">.csv</span> file with the following columns:
            </p>
            <code className="block text-xs font-mono-tech text-steel break-all">{TEMPLATE_HEADERS}</code>
            <ul className="text-xs text-steel space-y-1 list-disc list-inside">
              <li><span className="text-paper-dim">price</span> — decimal USD (e.g. <span className="text-paper-dim">9.99</span>)</li>
              <li><span className="text-paper-dim">category</span> — must match an existing category slug</li>
              <li><span className="text-paper-dim">isActive / featured / ageRestricted</span> — <span className="text-paper-dim">true</span> or <span className="text-paper-dim">false</span></li>
              <li>Existing SKUs are <span className="text-paper-dim">updated</span>; new SKUs are <span className="text-paper-dim">created</span></li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs text-flame hover:text-flame-bright transition-colors mt-1"
            >
              <Download className="w-3.5 h-3.5" /> Download template
            </button>
          </div>

          {/* File picker */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-hairline rounded-sm p-8 text-center cursor-pointer hover:border-flame transition-colors"
          >
            <Upload className="w-5 h-5 text-steel mx-auto mb-2" />
            {file ? (
              <p className="text-sm text-paper">{file.name}</p>
            ) : (
              <p className="text-sm text-paper-dim">Click to select a CSV file</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError(null); }}
            />
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {result.created} created, {result.updated} updated
                  {result.errors.length > 0 && `, ${result.errors.length} skipped`}
                  {" "}out of {result.total} rows
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-graphite border border-hairline rounded-sm p-3 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-danger font-mono-tech">
                      Row {e.row}{e.sku ? ` (${e.sku})` : ""}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleImport} disabled={!file || importing} className="flex-1">
              {importing ? "Importing..." : "Import"}
            </Button>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
