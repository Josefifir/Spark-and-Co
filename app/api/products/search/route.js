import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
const cache = require("@/lib/cache");

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  if (cached !== null) return NextResponse.json(cached);

  await dbConnect();

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  // Fetch name-matches and description-matches separately so name hits always come first
  const [nameMatches, descMatches] = await Promise.all([
    Product.find({ name: regex, isActive: true })
      .select("name slug priceCents images category")
      .limit(6)
      .lean(),
    Product.find({ description: regex, isActive: true })
      .select("name slug priceCents images category")
      .limit(6)
      .lean(),
  ]);

  // Merge: name matches first, then description-only matches, deduplicated, max 6
  const seen = new Set();
  const results = [];
  for (const p of [...nameMatches, ...descMatches]) {
    const id = p._id.toString();
    if (!seen.has(id)) { seen.add(id); results.push(p); }
    if (results.length === 6) break;
  }

  const payload = { results: JSON.parse(JSON.stringify(results)) };
  await cache.set(cacheKey, payload, 120); // 2 min cache
  return NextResponse.json(payload);
}
