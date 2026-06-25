import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/Categories";
import cache, { CacheKeys, CacheTTL } from "@/lib/cache";

export async function GET() {
  const cacheKey = CacheKeys.categories();
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  await dbConnect();

  const categories = await Category.find({ isActive: true })
    .select("-__v")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const payload = { categories };
  await cache.set(cacheKey, payload, CacheTTL.LONG);

  return NextResponse.json(payload);
}