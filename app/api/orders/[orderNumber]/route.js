import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request, { params }) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `order-status:${ip}`, limit: 5, windowMs: 60_000 });
  if (!limited.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  await dbConnect();
  const { orderNumber } = await params;

  // Only expose minimal, non-sensitive info publicly - no full address, no payment IDs.
  const order = await Order.findOne({ orderNumber }).select(
    "orderNumber paymentStatus fulfillmentStatus totalCents currency items.name items.quantity createdAt"
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
