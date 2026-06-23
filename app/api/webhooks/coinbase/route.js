import { NextResponse } from "next/server";
import { verifyCoinbaseWebhookSignature } from "@/lib/payments/verifyCoinbaseWebhook";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-cc-webhook-signature");

  let valid;
  try {
    valid = verifyCoinbaseWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("Coinbase webhook verification error:", err.message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  await dbConnect();

  const chargeId = event.event?.data?.id;
  const eventType = event.event?.type;

  if (!chargeId) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const order = await Order.findOne({ coinbaseChargeId: chargeId }).populate('items.product');
  if (!order) {
    // Acknowledge so Coinbase doesn't retry forever, but nothing to do.
    return NextResponse.json({ received: true });
  }

  switch (eventType) {
    case "charge:confirmed":
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.fulfillmentStatus = "processing";
        await order.save();
        
        // Send order confirmation email
        await sendOrderConfirmationEmail(order);
      }
      break;

    case "charge:failed":
    case "charge:resolved": {
      // 'resolved' can mean it was settled after being underpaid/delayed - treat conservatively.
      if (eventType === "charge:failed" && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        }
      }
      break;
    }

    case "charge:delayed":
      // Payment detected on-chain but awaiting confirmations - keep as pending.
      break;

    case "charge:pending":
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
