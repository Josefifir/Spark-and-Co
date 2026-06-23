import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { getCustomerSession } from "@/lib/auth/customerSession";

// GET - Get order history for logged-in customer
export async function GET(request) {
  const session = await getCustomerSession();
  
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Find orders by customer ID or email
    const orders = await Order.find({
      $or: [
        { customer: session.customerId },
        { customerEmail: session.email }
      ]
    })
      .populate("items.product", "name slug images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments({
      $or: [
        { customer: session.customerId },
        { customerEmail: session.email }
      ]
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to get orders" }, { status: 500 });
  }
}

// Made with Bob