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

  const results = await Product.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: "textScore" } }
  )
    .select("name slug priceCents images category")
    .sort({ score: { $meta: "textScore" } })
    .limit(6)
    .lean();

  const payload = { results: JSON.parse(JSON.stringify(results)) };
  await cache.set(cacheKey, payload, 120); // 2 min cache
  return NextResponse.json(payload);
}
