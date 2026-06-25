import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const GET = requireAdmin(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  
  // Validate pagination params
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 200); // Max 200 per page
  const skip = (validPage - 1) * validLimit;

  const filter = {};
  if (status) filter.paymentStatus = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  return NextResponse.json({
    orders,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      pages: Math.ceil(total / validLimit),
      hasMore: skip + orders.length < total
    }
  });
});
