import path from "path";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const PUBLIC_PATH_PREFIX = "/uploads/products";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB upload cap
const MAX_DIMENSION_PX = 2400; // re-encoded images are capped to this on the long edge
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageUploadError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Accepts a File (from a multipart/form-data request), validates it's a real
 * image (sniffing actual file bytes, not trusting the client-supplied MIME
 * type or filename extension), strips EXIF/metadata, re-encodes it, caps its
 * dimensions, and writes it to public/uploads/products.
 *
 * Returns the public URL path to store on the Product document.
 */
export async function saveProductImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new ImageUploadError("No file provided.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new ImageUploadError("Image is too large. Max size is 8MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Sniff the actual file content - never trust file.type or the filename,
  // both are fully attacker-controlled.
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new ImageUploadError("Unsupported file type. Please upload a JPEG, PNG, or WebP image.");
  }

  // Re-encode through sharp. This strips any embedded scripts/EXIF/metadata
  // and guards against malformed images crafted to exploit image parsers
  // downstream, since we produce a clean, known-good file ourselves.
  let outputBuffer;
  try {
    outputBuffer = await sharp(buffer)
      .rotate() // apply EXIF orientation, then strip metadata
      .resize({ width: MAX_DIMENSION_PX, height: MAX_DIMENSION_PX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ImageUploadError("That file doesn't look like a valid image.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${crypto.randomBytes(16).toString("hex")}.webp`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await writeFile(filePath, outputBuffer);

  return `${PUBLIC_PATH_PREFIX}/${filename}`;
}