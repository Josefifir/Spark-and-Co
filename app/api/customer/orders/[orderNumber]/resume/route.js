import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getCustomerSession } from "@/lib/auth/customerSession";
import { stripe } from "@/lib/payments/stripe";

/**
 * GET /api/customer/orders/[orderNumber]/resume
 *
 * Returns the data needed to re-enter the payment flow for a pending order.
 * For Stripe: retrieves the existing PaymentIntent client_secret from Stripe.
 * For Bitcoin: returns the BTCPay Server invoice checkout URL from the order.
 */
export async function GET(_request, { params }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { orderNumber } = await params;

  const order = await Order.findOne({
    orderNumber,
    $or: [{ customer: session.customerId }, { customerEmail: session.email }],
  }).lean();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus !== "pending") {
    return NextResponse.json({ error: "Order is not pending." }, { status: 400 });
  }

  // Stripe / SEPA / Revolut — retrieve the existing PaymentIntent
  if (order.stripePaymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
    if (intent.status === "succeeded") {
      return NextResponse.json({ error: "Payment already succeeded." }, { status: 400 });
    }
    if (intent.status === "canceled") {
      return NextResponse.json({ error: "Payment was cancelled." }, { status: 400 });
    }
    return NextResponse.json({
      paymentMethod: order.paymentMethod,
      clientSecret: intent.client_secret,
      orderNumber: order.orderNumber,
    });
  }

  // Bitcoin / BTCPay Server
  if (order.btcpayInvoiceId) {
    const host = process.env.BTCPAY_HOST?.replace(/\/$/, "");
    const storeId = process.env.BTCPAY_STORE_ID;
    return NextResponse.json({
      paymentMethod: "bitcoin",
      hostedUrl: `${host}/i/${order.btcpayInvoiceId}`,
      orderNumber: order.orderNumber,
    });
  }

  return NextResponse.json({ error: "No payment session found for this order." }, { status: 400 });
}
