import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const GET = requireAdmin(async () => {
  await dbConnect();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [salesVelocity, products, coPurchases, clv] = await Promise.all([
    // Sales velocity: units sold per product in last 30 days
    Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.product",
        unitsSold30d: { $sum: "$items.quantity" },
        name: { $first: "$items.name" },
      }},
    ]),

    // All active products with stock
    Product.find({ isActive: true }).select("_id name stock").lean(),

    // Co-purchase frequency: top 10 pairs
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $project: { items: { $slice: ["$items", 10] } } }, // limit for performance
      { $unwind: { path: "$items", includeArrayIndex: "idx" } },
      { $group: {
        _id: "$_id",
        products: { $push: "$items.product" },
        names: { $push: "$items.name" },
      }},
      { $unwind: { path: "$products", includeArrayIndex: "i" } },
      { $unwind: { path: "$names", includeArrayIndex: "j" } },
      { $match: { $expr: { $lt: ["$i", "$j"] } } }, // unique pairs only
      { $group: {
        _id: { p1: { $min: ["$products", "$products"] }, p2: { $max: ["$products", "$products"] } },
        count: { $sum: 1 },
      }},
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // CLV: total spend per customer email, sorted by total
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: {
        _id: "$customerEmail",
        totalCents: { $sum: "$totalCents" },
        orderCount: { $sum: 1 },
        lastOrderAt: { $max: "$createdAt" },
        country: { $first: "$shippingAddress.country" },
      }},
      { $sort: { totalCents: -1 } },
      { $limit: 50 },
    ]),
  ]);

  // Map velocity by productId
  const velocityMap = new Map(salesVelocity.map((v) => [v._id.toString(), v]));

  // Merge with current stock to forecast runout
  const forecast = products.map((p) => {
    const vel = velocityMap.get(p._id.toString());
    const unitsPer30d = vel?.unitsSold30d || 0;
    const dailyRate = unitsPer30d / 30;
    const daysUntilOut = dailyRate > 0 ? Math.floor(p.stock / dailyRate) : null;
    return {
      _id: p._id,
      name: p.name,
      stock: p.stock,
      unitsPer30d,
      dailyRate: Math.round(dailyRate * 10) / 10,
      daysUntilOut,
    };
  }).sort((a, b) => {
    // Sort: products with a runout date first, then by daysUntilOut asc
    if (a.daysUntilOut !== null && b.daysUntilOut !== null) return a.daysUntilOut - b.daysUntilOut;
    if (a.daysUntilOut !== null) return -1;
    if (b.daysUntilOut !== null) return 1;
    return a.stock - b.stock;
  });

  return NextResponse.json({
    forecast,
    clv,
    coPurchaseCount: coPurchases.length, // just the count; pairs need product lookup for names
  });
});
