import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { awardReferralCredit } from "@/lib/referral";

// Stripe requires the raw, unparsed request body to verify signatures.
export const runtime = "nodejs";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await dbConnect();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const order = await Order.findOne({
        $or: [
          { stripeSessionId: session.id },
          { stripePaymentIntentId: session.payment_intent },
        ],
      }).populate("items.product");

      if (!order || order.paymentStatus === "paid") break;

      order.paymentStatus = "paid";
      order.fulfillmentStatus = "processing";
      await order.save();

      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError.message);
      }
      break;
    }
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id }).populate("items.product");

      if (!order || order.paymentStatus === "paid") break;

      order.paymentStatus = "paid";
      order.fulfillmentStatus = "processing";
      await order.save();

      await awardReferralCredit(order._id).catch((e) => console.error("Referral credit error:", e));

      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError.message);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });
      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
