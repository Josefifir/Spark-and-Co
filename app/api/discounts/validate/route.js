import { validateDiscountCode } from "@/lib/utils-pricing.js";
import { rateLimit, getClientIp } from "@/lib/rateLimit.js";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limited = await rateLimit({ key: `discount-validate:${ip}`, limit: 10, windowMs: 60_000 });
    if (!limited.allowed) {
      return NextResponse.json(
        { valid: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code, subtotalCents, cartItems } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Discount code is required" },
        { status: 400 }
      );
    }

    if (!subtotalCents || subtotalCents < 0 || subtotalCents > 100_000_00) {
      return NextResponse.json(
        { valid: false, error: "Invalid order total" },
        { status: 400 }
      );
    }

    const cartItemProductIds = cartItems?.map((item) => item.productId) || [];

    const result = await validateDiscountCode(
      code,
      subtotalCents,
      cartItemProductIds
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Error validating discount code" },
      { status: 500 }
    );
  }
}
