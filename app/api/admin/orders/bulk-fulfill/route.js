import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendShippingNotificationEmail } from "@/lib/email/resend";

const BulkSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
  fulfillmentStatus: z.enum(["processing", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().max(200).optional(),
  trackingUrl: z.string().max(500).optional(),
});

export const POST = requireAdmin(async (request) => {
  let body;
  try { body = BulkSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data", details: err.errors?.map(e => e.message) }, { status: 400 }); }

  await dbConnect();

  const { orderIds, fulfillmentStatus, trackingNumber, trackingUrl } = body;

  const orders = await Order.find({ _id: { $in: orderIds } });
  const results = [];

  for (const order of orders) {
    const prevStatus = order.fulfillmentStatus;
    order.fulfillmentStatus = fulfillmentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;
    await order.save();

    // Trigger shipping email if newly shipped
    if (fulfillmentStatus === "shipped" && prevStatus !== "shipped") {
      sendShippingNotificationEmail(order).catch(e =>
        console.error("Bulk shipping notification error:", e.message)
      );
    }

    results.push({ id: order._id, orderNumber: order.orderNumber, status: fulfillmentStatus });
  }

  return NextResponse.json({ updated: results.length, results });
});
