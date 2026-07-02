import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { stripe } from "@/lib/payments/stripe";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendShippingNotificationEmail, sendDeliveryConfirmationEmail } from "@/lib/email/resend";

const UpdateSchema = z.object({
  fulfillmentStatus: z.enum(["unfulfilled", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().max(200).optional(),
  trackingUrl: z.string().max(500).optional(),
});

export const GET = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  const order = await Order.findById(id).populate("items.product", "name images");
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let data;
  try {
    data = UpdateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid data", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();
  const { id } = await params;

  const order = await Order.findById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previousFulfillmentStatus = order.fulfillmentStatus;
  Object.assign(order, data);
  await order.save();

  // Side-effect: shipping notification email when transitioning to "shipped"
  if (
    data.fulfillmentStatus === "shipped" &&
    previousFulfillmentStatus !== "shipped"
  ) {
    sendShippingNotificationEmail(order).catch((e) =>
      console.error("Shipping notification email error:", e)
    );
  }

  // Side-effect: delivery confirmation + review request when transitioning to "delivered"
  if (
    data.fulfillmentStatus === "delivered" &&
    previousFulfillmentStatus !== "delivered"
  ) {
    // Populate items.product so review links can be generated
    const populatedOrder = await Order.findById(order._id).populate("items.product", "_id slug name");
    sendDeliveryConfirmationEmail(populatedOrder).catch((e) =>
      console.error("Delivery confirmation email error:", e)
    );
  }

  // Side-effect: cancel the Stripe PaymentIntent and restore stock when cancelling
  if (
    data.fulfillmentStatus === "cancelled" &&
    previousFulfillmentStatus !== "cancelled"
  ) {
    // Cancel the Stripe PaymentIntent if it hasn't been captured yet
    if (order.stripePaymentIntentId && order.paymentStatus === "pending") {
      stripe.paymentIntents
        .cancel(order.stripePaymentIntentId)
        .catch((e) => console.error("Stripe PI cancel error:", e));

      order.paymentStatus = "cancelled";
      await order.save();
    }

    // Restore stock for all items
    const restoreOps = order.items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    }));
    if (restoreOps.length) await Product.bulkWrite(restoreOps);
  }

  return NextResponse.json({ order });
});
