import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import cache from "@/lib/cache";

// Returns daily revenue for the last N days (default 30)
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get("days") || "30", 10)));

  const cacheKey = `revenue-chart:${days}`;
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  await dbConnect();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const daily = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalCents" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Fill gaps with zero days
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const match = daily.find(
      r => r._id.year === year && r._id.month === month && r._id.day === day
    );
    result.push({
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      revenue: match?.revenue || 0,
      orders: match?.orders || 0,
    });
  }

  const payload = { days: result };
  await cache.set(cacheKey, payload, 300); // 5-minute cache
  return NextResponse.json(payload);
});
