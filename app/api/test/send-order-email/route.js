import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

// TEST ENDPOINT - Remove in production
// GET /api/test/send-order-email?orderNumber=XXX
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber query parameter required" }, { status: 400 });
  }

  await dbConnect();

  try {
    const order = await Order.findOne({ orderNumber }).populate('items.product');
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await sendOrderConfirmationEmail(order);

    return NextResponse.json({
      message: "Email send attempted",
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      result
    });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Made with Bob