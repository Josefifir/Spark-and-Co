import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Return from "@/lib/models/Return";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { stripe } from "@/lib/payments/stripe";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  status: z.enum(["requested", "approved", "rejected", "label_sent", "received", "refunded"]).optional(),
  adminNote: z.string().max(1000).optional(),
  returnLabelUrl: z.string().max(500).optional(),
  refundAmountCents: z.number().int().min(0).optional(),
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let body;
  try { body = UpdateSchema.parse(await request.json()); }
  catch { return NextResponse.json({ error: "Invalid data." }, { status: 400 }); }

  await dbConnect();
  const { id } = await params;

  const ret = await Return.findById(id);
  if (!ret) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const previousStatus = ret.status;
  Object.assign(ret, body);
  await ret.save();

  // Side-effects when transitioning to "refunded"
  if (body.status === "refunded" && previousStatus !== "refunded") {
    const order = await Order.findById(ret.order);

    // Issue Stripe refund if a payment intent exists and an amount is specified
    if (
      order?.stripePaymentIntentId &&
      order.paymentStatus === "paid" &&
      body.refundAmountCents > 0
    ) {
      stripe.refunds
        .create({
          payment_intent: order.stripePaymentIntentId,
          amount: body.refundAmountCents,
        })
        .then(async () => {
          // Mark order as refunded only if full amount is returned
          if (body.refundAmountCents >= order.totalCents) {
            await Order.updateOne({ _id: order._id }, { paymentStatus: "refunded" });
          }
        })
        .catch((e) => console.error("Stripe refund error:", e));
    }

    // Restore stock for returned items
    const restoreOps = ret.items.map((item) => {
      // Match returned item name to order item to get the product ObjectId
      const orderItem = order?.items?.find((oi) => oi.name === item.productName);
      if (!orderItem) return null;
      return {
        updateOne: {
          filter: { _id: orderItem.product },
          update: { $inc: { stock: item.quantity } },
        },
      };
    }).filter(Boolean);

    if (restoreOps.length) await Product.bulkWrite(restoreOps);
  }

  return NextResponse.json({ return: ret });
});
