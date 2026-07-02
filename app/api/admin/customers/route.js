import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Customer from "@/lib/models/Customer";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/customers — with LTV (lifetime value) aggregated from orders
export const GET = requireAdmin(async (request) => {
  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = 50;
  const skip  = (page - 1) * limit;
  const q     = searchParams.get("q") || "";

  await dbConnect();

  const filter = q
    ? { $or: [{ email: { $regex: q, $options: "i" } }, { firstName: { $regex: q, $options: "i" } }, { lastName: { $regex: q, $options: "i" } }] }
    : {};

  const [customers, total] = await Promise.all([
    Customer.find(filter).select("email firstName lastName createdAt loyaltyPoints marketingOptIn").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);

  // Aggregate LTV for this page of customers
  const ids = customers.map((c) => c._id);
  const ltv = await Order.aggregate([
    { $match: { customer: { $in: ids }, paymentStatus: "paid" } },
    { $group: { _id: "$customer", totalSpent: { $sum: "$totalCents" }, orderCount: { $sum: 1 }, lastOrderAt: { $max: "$createdAt" } } },
  ]);
  const ltvMap = new Map(ltv.map((r) => [r._id.toString(), r]));

  const enriched = customers.map((c) => {
    const l = ltvMap.get(c._id.toString());
    return {
      ...c,
      totalSpentCents: l?.totalSpent || 0,
      orderCount: l?.orderCount || 0,
      lastOrderAt: l?.lastOrderAt || null,
    };
  });

  return NextResponse.json({ customers: enriched, total, page, pages: Math.ceil(total / limit) });
});
