import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { awardReferralCredit } from "@/lib/referral";
import { awardLoyaltyPoints } from "@/lib/loyalty";

export const runtime = "nodejs";

// Stripe requires the raw body for signature verification — do NOT parse as JSON before this.
export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await dbConnect();

  const paymentIntent = event.data?.object;
  const piId = paymentIntent?.id;
  if (!piId) return NextResponse.json({ received: true });

  switch (event.type) {
    case "payment_intent.succeeded": {
      const order = await Order.findOne({ stripePaymentIntentId: piId }).populate("items.product");
      if (!order) break;

      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.fulfillmentStatus = "processing";
        await order.save();

        await awardReferralCredit(order._id).catch((e) =>
          console.error("Referral credit error:", e)
        );
        await awardLoyaltyPoints(order._id).catch((e) =>
          console.error("Loyalty points error:", e)
        );
        await sendOrderConfirmationEmail(order).catch((e) =>
          console.error("Order confirmation email error:", e)
        );
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const order = await Order.findOne({ stripePaymentIntentId: piId });
      if (!order) break;

      if (order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();

        // Restore stock that was reserved at checkout
        const restoreOps = order.items.map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: item.quantity } },
          },
        }));
        if (restoreOps.length) await Product.bulkWrite(restoreOps);
      }
      break;
    }

    case "payment_intent.canceled": {
      const order = await Order.findOne({ stripePaymentIntentId: piId });
      if (!order) break;

      if (order.paymentStatus === "pending") {
        order.paymentStatus = "cancelled";
        await order.save();

        const restoreOps = order.items.map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { stock: item.quantity } },
          },
        }));
        if (restoreOps.length) await Product.bulkWrite(restoreOps);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
