import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { calculateBulkPrice } from "@/lib/utils-pricing-client";

// Lightweight CSV parser — avoids adding a dependency
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const cells = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { cells.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const rows = lines.slice(1).map((line, i) => {
    const cells = parseRow(line);
    const row = {};
    headers.forEach((h, j) => { row[h] = cells[j] ?? ""; });
    row._rowNum = i + 2; // 1-based, accounting for header
    return row;
  }).filter((r) => Object.values(r).some((v) => v !== "" && v !== undefined));

  return { headers, rows };
}

// POST /api/bulk-order/parse
// Accepts: multipart form with a "file" field (CSV)
// Returns: { valid: CartItem[], errors: RowError[] }
export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `bulk-order:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  if (text.length > 200_000) {
    return NextResponse.json({ error: "File too large (max 200 KB)" }, { status: 400 });
  }

  const { headers, rows } = parseCSV(text);

  if (!headers.includes("sku") || !headers.includes("quantity")) {
    return NextResponse.json({
      error: 'CSV must have "sku" and "quantity" columns',
    }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }
  if (rows.length > 200) {
    return NextResponse.json({ error: "Maximum 200 rows per upload" }, { status: 400 });
  }

  await dbConnect();

  const skus = [...new Set(rows.map((r) => r.sku).filter(Boolean))];
  const products = await Product.find({
    sku: { $in: skus },
    isActive: true,
  }).select("_id sku name slug priceCents salePriceCents saleEndsAt images stock bulkPricingTiers").lean();

  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const valid = [];
  const errors = [];

  for (const row of rows) {
    const sku = row.sku?.trim();
    const quantity = parseInt(row.quantity, 10);

    if (!sku) { errors.push({ row: row._rowNum, error: "Missing SKU" }); continue; }
    if (!quantity || isNaN(quantity) || quantity < 1) { errors.push({ row: row._rowNum, sku, error: "Invalid quantity" }); continue; }
    if (quantity > 500) { errors.push({ row: row._rowNum, sku, error: "Quantity exceeds maximum of 500 per line" }); continue; }

    const product = productBySku.get(sku);
    if (!product) { errors.push({ row: row._rowNum, sku, error: "SKU not found" }); continue; }

    if (product.stock < quantity && !product.allowPreorder) {
      errors.push({ row: row._rowNum, sku, error: `Only ${product.stock} in stock` });
      continue;
    }

    const now = new Date();
    const saleActive = product.salePriceCents != null &&
      product.salePriceCents < product.priceCents &&
      (!product.saleEndsAt || now < new Date(product.saleEndsAt));
    const basePriceCents = saleActive ? product.salePriceCents : product.priceCents;

    const bulkPrice = calculateBulkPrice(basePriceCents, quantity, product.bulkPricingTiers || []);

    valid.push({
      productId: product._id.toString(),
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      priceCents: bulkPrice.unitPriceCents,
      originalPriceCents: product.priceCents,
      quantity,
      image: product.images?.[0] || null,
      stock: product.stock,
      bulkApplied: bulkPrice.bulkApplied,
      discountPercent: bulkPrice.discountPercent || 0,
    });
  }

  return NextResponse.json({ valid, errors, totalRows: rows.length });
}
