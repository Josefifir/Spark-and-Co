import { NextResponse } from "next/server";
import path from "path";
import { unlink } from "fs/promises";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { saveProductImage, ImageUploadError } from "@/lib/uploads";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

export const POST = requireAdmin(async (request) => {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `upload:${ip}`, limit: 30, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  const file = formData.get("file");

  try {
    const url = await saveProductImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof ImageUploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Image upload failed:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
});

export const DELETE = requireAdmin(async (request) => {
  const { url } = await request.json().catch(() => ({}));

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url." }, { status: 400 });
  }

  // Only allow deleting files inside our own uploads directory, and only by
  // basename - reject anything containing path traversal segments.
  const filename = path.basename(url);
  if (
    !url.startsWith("/uploads/products/") ||
    filename.includes("..") ||
    filename !== path.basename(filename)
  ) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    await unlink(filePath);
  } catch (err) {
    // If it's already gone, that's fine - don't error on a no-op cleanup.
    if (err.code !== "ENOENT") {
      console.error("Failed to delete image:", err);
      return NextResponse.json({ error: "Failed to delete file." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
});