import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/inventory-forecast
// Returns products with stock, 30-day sales rate, and projected days until stockout
export const GET = requireAdmin(async () => {
  await dbConnect();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Aggregate units sold per product in the last 30 days
  const salesData = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: "paid" } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", sold30d: { $sum: "$items.quantity" } } },
  ]);
  const salesMap = new Map(salesData.map((r) => [r._id.toString(), r.sold30d]));

  const products = await Product.find({ isActive: true })
    .select("name sku slug stock lowStockThreshold")
    .lean();

  const forecast = products.map((p) => {
    const sold30d = salesMap.get(p._id.toString()) || 0;
    const dailyRate = sold30d / 30;
    const daysUntilStockout = dailyRate > 0 ? Math.floor(p.stock / dailyRate) : null;
    return {
      _id: p._id,
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      stock: p.stock,
      sold30d,
      dailyRate: parseFloat(dailyRate.toFixed(2)),
      daysUntilStockout,
      belowThreshold: p.lowStockThreshold != null && p.stock <= p.lowStockThreshold,
    };
  });

  // Sort: urgent first (lowest days until stockout), then by stock
  forecast.sort((a, b) => {
    if (a.daysUntilStockout === null && b.daysUntilStockout === null) return a.stock - b.stock;
    if (a.daysUntilStockout === null) return 1;
    if (b.daysUntilStockout === null) return -1;
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  return NextResponse.json({ forecast });
});
