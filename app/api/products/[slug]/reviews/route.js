import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import ProductReview from "@/lib/models/ProductReview";
import { verifyReviewToken } from "@/lib/reviews/verifyReviewToken";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { z } from "zod";

const SubmitReviewSchema = z.object({
  token: z.string().min(1, "Review token is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().max(100, "Title too long").optional(),
  text: z.string().min(1, "Review text required").max(5000, "Review too long"),
  customerName: z.string().max(100, "Name too long").optional(),
});

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    await dbConnect();

    // Get product to verify it exists
    const product = await Product.findOne({ slug, isActive: true });
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get approved reviews
    const reviews = await ProductReview.find({
      product: product._id,
      status: "approved",
    })
      .select("rating title text customerName createdAt")
      .sort({ createdAt: -1 })
      .lean()
      .limit(20);

    return NextResponse.json({
      reviews,
      averageRating: product.averageRating || null,
      reviewCount: product.reviewCount || 0,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit({ key: `review-submit:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "Too many review submissions. Please try again later." },
        { status: 429 }
      );
    }

    const { slug } = await params;
    const body = await request.json();
    const validated = SubmitReviewSchema.parse(body);

    await dbConnect();

    // Verify token
    const tokenVerification = await verifyReviewToken(validated.token);
    if (!tokenVerification.valid) {
      return NextResponse.json(
        { error: tokenVerification.error },
        { status: 400 }
      );
    }

    const { orderNumber, email, productId } = tokenVerification;

    // Get product to verify it exists
    const product = await Product.findOne({ _id: productId, slug, isActive: true });
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if this token has already been used
    const tokenUsed = await ProductReview.findOne({
      reviewToken: validated.token,
    });

    if (tokenUsed) {
      return NextResponse.json(
        { error: "This review link has already been used. Each link can only be used once." },
        { status: 409 }
      );
    }

    // Check for existing review from same email for same product
    const existingReview = await ProductReview.findOne({
      product: productId,
      customerEmail: email,
      orderNumber,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this purchase." },
        { status: 409 }
      );
    }

    // Create review (status: pending by default) and store the token to prevent reuse
    const review = new ProductReview({
      product: productId,
      rating: validated.rating,
      title: validated.title || "",
      text: validated.text,
      customerEmail: email,
      customerName: validated.customerName || email.split("@")[0],
      orderNumber,
      reviewToken: validated.token, // Store token to prevent reuse
      status: "pending",
    });

    await review.save();

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted! Thanks for your feedback. It will appear after admin approval.",
        reviewId: review._id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
