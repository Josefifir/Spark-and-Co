import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
const cache = require("@/lib/cache");

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;

  const cacheKey = `recently-sold:${slug}`;
  const cached = await cache.get(cacheKey);
  if (cached !== null) return NextResponse.json(cached);

  await dbConnect();

  const product = await Product.findOne({ slug, isActive: true }).select("_id").lean();
  if (!product) return NextResponse.json({ count: 0 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    { $unwind: "$items" },
    { $match: { "items.product": product._id } },
    { $group: { _id: null, count: { $sum: "$items.quantity" } } },
  ]);

  const payload = { count: result[0]?.count || 0 };
  await cache.set(cacheKey, payload, 600); // 10-min cache
  return NextResponse.json(payload);
}
