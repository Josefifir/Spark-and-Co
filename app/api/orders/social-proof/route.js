import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import cache from "@/lib/cache";

export const dynamic = "force-dynamic";

// Returns the last few recent orders for social proof: "Someone in {city} just bought {product}"
// We show only city + first name initial — no email/full name exposed
export async function GET() {
  const cacheKey = "social-proof:recent";
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  await dbConnect();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const orders = await Order.find({
    paymentStatus: "paid",
    createdAt: { $gte: since },
    "shippingAddress.city": { $exists: true, $ne: "" },
  })
    .select("items shippingAddress createdAt")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const proofs = orders
    .flatMap(order =>
      order.items.map(item => ({
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
        productName: item.name,
        quantity: item.quantity,
        // How many minutes ago
        minutesAgo: Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60_000)),
      }))
    )
    .slice(0, 10); // at most 10 proof items

  const payload = { proofs };
  await cache.set(cacheKey, payload, 120); // 2-minute cache
  return NextResponse.json(payload);
}
