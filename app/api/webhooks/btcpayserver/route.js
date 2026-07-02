import { NextResponse } from "next/server";
import { verifyBtcpayWebhookSignature } from "@/lib/payments/verifyBtcpayWebhook";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { awardReferralCredit } from "@/lib/referral";

export const runtime = "nodejs";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("btcpay-sig");

  let valid;
  try {
    valid = verifyBtcpayWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error("BTCPay webhook verification error:", err.message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  await dbConnect();

  // BTCPay Greenfield webhook payload shape:
  // { type: "InvoiceSettled" | "InvoiceExpired" | ..., invoiceId: "...", metadata: { orderNumber } }
  const invoiceId = event.invoiceId;
  const eventType = event.type;

  if (!invoiceId) {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }

  const order = await Order.findOne({ btcpayInvoiceId: invoiceId }).populate("items.product");
  if (!order) {
    // Acknowledge so BTCPay doesn't retry forever, but nothing to do.
    return NextResponse.json({ received: true });
  }

  switch (eventType) {
    case "InvoiceSettled":
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.fulfillmentStatus = "processing";
        await order.save();

        await awardReferralCredit(order._id).catch((e) => console.error("Referral credit error:", e));
        await sendOrderConfirmationEmail(order);
      }
      break;

    case "InvoiceExpired":
    case "InvoiceInvalid":
      if (order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        await order.save();
        for (const item of order.items) {
          await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
        }
      }
      break;

    // InvoiceReceivedPayment / InvoiceProcessing — payment detected, awaiting confirmations
    case "InvoiceReceivedPayment":
    case "InvoiceProcessing":
      // Keep as pending until fully settled
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
