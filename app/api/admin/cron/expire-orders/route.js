import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";

export const runtime = "nodejs";

// Protect this route with a shared secret passed as a header.
// Call it from a cron job: curl -H "x-cron-secret: $CRON_SECRET" https://yourdomain.com/api/admin/cron/expire-orders
export async function POST(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  // Find all pending orders older than 2 hours that have a Stripe or BTCPay reference
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const staleOrders = await Order.find({
    paymentStatus: "pending",
    createdAt: { $lt: cutoff },
  }).lean();

  if (staleOrders.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  let expired = 0;
  for (const order of staleOrders) {
    // Restore stock
    const restoreOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));
    if (restoreOps.length) await Product.bulkWrite(restoreOps);

    await Order.updateOne({ _id: order._id }, { paymentStatus: "expired" });
    expired++;
  }

  console.log(`[cron/expire-orders] Expired ${expired} stale pending orders.`);
  return NextResponse.json({ expired });
}
