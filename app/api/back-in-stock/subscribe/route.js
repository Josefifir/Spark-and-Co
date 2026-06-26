import { dbConnect } from "@/lib/db.js";
import Product from "@/lib/models/Product.js";
import BackInStockSubscription from "@/lib/models/BackInStockSubscription.js";
import { rateLimit, getClientIp } from "@/lib/rateLimit.js";
import { z } from "zod";
import { NextResponse } from "next/server";

const subscribeSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  email: z.string().email("Invalid email address"),
});

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limited = await rateLimit({ key: `back-in-stock:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limited.allowed) {
      return NextResponse.json(
        {
          subscribed: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { productId, email: userEmail } = subscribeSchema.parse(body);

    // Verify product exists and is out of stock
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { subscribed: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (product.stock > 0) {
      return NextResponse.json(
        { subscribed: false, message: "Product is currently in stock" },
        { status: 400 }
      );
    }

    // Check for existing subscription
    const existing = await BackInStockSubscription.findOne({
      productId,
      email: userEmail.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        {
          subscribed: false,
          message: "You are already subscribed to notifications for this product",
        },
        { status: 409 }
      );
    }

    // Create subscription with 30-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscription = new BackInStockSubscription({
      productId,
      email: userEmail.toLowerCase(),
      expiresAt,
    });

    await subscription.save();

    return NextResponse.json(
      {
        subscribed: true,
        message: `We'll notify you at ${userEmail} when ${product.name} is back in stock`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          subscribed: false,
          message: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    console.error("Back-in-stock subscription error:", error);
    return NextResponse.json(
      {
        subscribed: false,
        message: "Error subscribing to notifications",
      },
      { status: 500 }
    );
  }
}
