import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Order from "@/lib/models/Order";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const LookupSchema = z.object({
  email: z.string().email(),
  orderNumber: z.string().min(1),
});

// POST - Guest order lookup (email + order number)
export async function POST(request) {
  const ip = getClientIp(request);
  const limited = await rateLimit({ key: `order-lookup:${ip}`, limit: 10, windowMs: 60_000 });
  
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many lookup attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = LookupSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid lookup data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const order = await Order.findOne({
      orderNumber: body.orderNumber,
      customerEmail: body.email.toLowerCase(),
    })
      .populate("items.product", "name slug images")
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please check your email and order number." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Order lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup order. Please try again." },
      { status: 500 }
    );
  }
}

// Made with Bob