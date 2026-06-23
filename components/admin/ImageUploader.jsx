"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 6;

export default function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    if (files.length === 0) {
      if (images.length >= MAX_IMAGES) toast.error(`Max ${MAX_IMAGES} images per product.`);
      return;
    }

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        uploaded.push(data.url);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
  };

  const handleRemove = async (url) => {
    onChange(images.filter((img) => img !== url));
    // Best-effort cleanup on disk - don't block the UI on this.
    fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs uppercase tracking-wider text-paper-dim font-mono-tech">
        Images
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url) => (
            <div key={url} className="relative aspect-square rounded-sm overflow-hidden border border-hairline group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-graphite/90 text-paper flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border border-dashed rounded-sm py-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            dragOver ? "border-flame bg-flame/5" : "border-hairline hover:border-steel"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 text-flame animate-spin" />
              <span className="text-xs text-paper-dim">Uploading...</span>
            </>
          ) : (
            <>
              {images.length === 0 ? (
                <ImageIcon className="w-5 h-5 text-steel" />
              ) : (
                <Upload className="w-5 h-5 text-steel" />
              )}
              <span className="text-xs text-paper-dim text-center px-4">
                Drag images here, or click to browse
                <br />
                <span className="text-steel">JPEG, PNG, or WebP · up to 8MB each</span>
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
        </div>
      )}
    </div>
  );
}