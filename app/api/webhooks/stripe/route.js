import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

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
    case "payment_intent.succeeded": {
      const intent = event.data.object;
      console.log('Payment succeeded for intent:', intent.id);
      
      const order = await Order.findOne({ stripePaymentIntentId: intent.id }).populate('items.product');
      
      if (!order) {
        console.log('No order found for payment intent:', intent.id);
        break;
      }
      
      console.log('Order found:', order.orderNumber, 'Status:', order.paymentStatus);
      
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.fulfillmentStatus = "processing";
        await order.save();
        console.log('Order status updated to paid:', order.orderNumber);
        
        // Send order confirmation email
        console.log('Attempting to send email to:', order.customerEmail);
        const emailResult = await sendOrderConfirmationEmail(order);
        console.log('Email send result:', emailResult);
      } else {
        console.log('Order already marked as paid, skipping email');
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: intent.id });
      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        // restock items since payment failed
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        }
      }
      break;
    }
    default:
      break; // ignore other event types
  }

  return NextResponse.json({ received: true });
}
