import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const GET = requireAdmin(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const filter = {};
  if (status) filter.paymentStatus = status;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ orders });
});
