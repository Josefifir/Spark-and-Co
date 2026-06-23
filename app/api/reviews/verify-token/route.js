import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ProductReview from "@/lib/models/ProductReview";
import { verifyReviewToken } from "@/lib/reviews/verifyReviewToken";

// POST - Check if a review token is valid and unused
export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    await dbConnect();

    // Check if token has been used
    const tokenUsed = await ProductReview.findOne({ reviewToken: token });
    
    if (tokenUsed) {
      return NextResponse.json({
        valid: false,
        used: true,
        message: "This review link has already been used. Each link can only be used once."
      });
    }

    // Verify token is valid (not expired, valid signature, etc.)
    const verification = await verifyReviewToken(token);
    
    if (!verification.valid) {
      return NextResponse.json({
        valid: false,
        used: false,
        message: verification.error
      });
    }

    // Check if user already submitted a review for this product
    const existingReview = await ProductReview.findOne({
      product: verification.productId,
      customerEmail: verification.email,
      orderNumber: verification.orderNumber,
    });

    if (existingReview) {
      return NextResponse.json({
        valid: false,
        used: true,
        message: "You have already submitted a review for this purchase."
      });
    }

    return NextResponse.json({
      valid: true,
      used: false,
      message: null
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}

// Made with Bob