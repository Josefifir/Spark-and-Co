import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";

export async function GET(request, { params }) {
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
