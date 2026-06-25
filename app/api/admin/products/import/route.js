import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Categories";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { slugify } from "@/lib/utils-shop";

/**
 * Expected CSV columns (header row required):
 *   name, sku, price, stock, category, description, isActive, featured, ageRestricted
 *
 * - price    : decimal USD (e.g. 9.99)
 * - isActive / featured / ageRestricted : "true" / "false" (default true/false/true)
 * - If a product with the same SKU already exists it is UPDATED; otherwise CREATED.
 */

function parseBoolean(val, defaultVal) {
  if (val === undefined || val === null || val === "") return defaultVal;
  return String(val).trim().toLowerCase() === "true";
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV parse — handles quoted fields containing commas
    const fields = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { fields.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    fields.push(cur.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = fields[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

export const POST = requireAdmin(async (request) => {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const text = await file.text();
  let rows;
  try {
    rows = parseCsv(text);
  } catch {
    return NextResponse.json({ error: "Could not parse CSV." }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV contains no data rows." }, { status: 400 });
  }

  await dbConnect();

  // Fetch all active category slugs for validation
  const allCategories = await Category.find({ isActive: true }).lean();
  const validCategories = new Set(allCategories.map((c) => c.slug));

  const results = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 = header

    const name = row.name?.trim();
    const sku  = row.sku?.trim();
    if (!name || !sku) {
      results.errors.push({ row: rowNum, error: "Missing required field: name or sku." });
      continue;
    }

    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
      results.errors.push({ row: rowNum, sku, error: "Invalid price." });
      continue;
    }

    const stock = parseInt(row.stock, 10);
    if (isNaN(stock) || stock < 0) {
      results.errors.push({ row: rowNum, sku, error: "Invalid stock value." });
      continue;
    }

    const category = row.category?.trim().toLowerCase();
    if (!category || !validCategories.has(category)) {
      results.errors.push({ row: rowNum, sku, error: `Unknown category "${category}". Create it first.` });
      continue;
    }

    const description = row.description?.trim() || name;
    const priceCents  = Math.round(price * 100);
    const isActive    = parseBoolean(row.isactive ?? row.isActive, true);
    const featured    = parseBoolean(row.featured, false);
    const ageRestricted = parseBoolean(row.agerestricted ?? row.ageRestricted, true);

    try {
      const existing = await Product.findOne({ sku });
      if (existing) {
        await Product.updateOne({ sku }, {
          $set: { name, description, priceCents, stock, category, isActive, featured, ageRestricted },
        });
        results.updated++;
      } else {
        const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 7);
        await Product.create({ name, slug, sku, description, priceCents, stock, category, isActive, featured, ageRestricted, bulkPricingTiers: [] });
        results.created++;
      }
    } catch (err) {
      results.errors.push({ row: rowNum, sku, error: err.message });
    }
  }

  return NextResponse.json({
    created: results.created,
    updated: results.updated,
    errors: results.errors,
    total: rows.length,
  });
});
