import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getCustomerSession } from "@/lib/auth/customerSession";

// GET - Get a specific order by order number (for logged-in customer)
export async function GET(request, { params }) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { orderNumber } = await params;

  await dbConnect();

  try {
    const order = await Order.findOne({
      orderNumber,
      $or: [
        { customer: session.customerId },
        { customerEmail: session.email }
      ]
    })
      .populate("items.product", "name slug images")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json({ error: "Failed to get order" }, { status: 500 });
  }
}

// Made with Bob