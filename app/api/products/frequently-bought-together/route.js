import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
const cache = require("@/lib/cache");

export const dynamic = "force-dynamic";

/**
 * Returns up to 4 products most frequently bought together with the given product IDs.
 * Used for cart upsell and purchase pattern analysis.
 * Query: /api/products/frequently-bought-together?ids=id1,id2,id3
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean).slice(0, 10);

  if (ids.length === 0) return NextResponse.json({ products: [] });

  const cacheKey = `fbt:${ids.sort().join(",")}`;
  const cached = await cache.get(cacheKey);
  if (cached !== null) return NextResponse.json(cached);

  await dbConnect();

  // Find orders that contain any of the given products
  const { Types } = await import("mongoose");
  const objectIds = ids.map((id) => { try { return new Types.ObjectId(id); } catch { return null; } }).filter(Boolean);
  if (!objectIds.length) return NextResponse.json({ products: [] });

  const result = await Order.aggregate([
    { $match: { paymentStatus: "paid", "items.product": { $in: objectIds } } },
    { $unwind: "$items" },
    // Exclude the products already in cart
    { $match: { "items.product": { $nin: objectIds } } },
    { $group: { _id: "$items.product", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 4 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    { $match: { "product.isActive": true, "product.stock": { $gt: 0 } } },
    {
      $project: {
        _id: "$product._id",
        name: "$product.name",
        slug: "$product.slug",
        priceCents: "$product.priceCents",
        images: "$product.images",
        count: 1,
      },
    },
  ]);

  const payload = { products: JSON.parse(JSON.stringify(result)) };
  await cache.set(cacheKey, payload, 1800); // 30 min cache
  return NextResponse.json(payload);
}
