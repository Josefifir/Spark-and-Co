import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ProductReview from "@/lib/models/ProductReview";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateProductRatings } from "@/lib/reviews/updateProductRatings";
import { z } from "zod";
import { ObjectId } from "mongodb";

const UpdateReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().max(500).optional(),
});

export const PATCH = requireAdmin(async (request, { params }, session) => {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const validated = UpdateReviewSchema.parse(body);

    const review = await ProductReview.findById(id);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Update review status
    if (validated.status === "approved") {
      review.status = "approved";
      review.approvedBy = session._id;
      review.approvedAt = new Date();
      review.rejectedAt = null;
      review.adminNote = null;
    } else if (validated.status === "rejected") {
      review.status = "rejected";
      review.rejectedAt = new Date();
      review.adminNote = validated.adminNote || null;
    }

    await review.save();

    // Recalculate product ratings
    await updateProductRatings(review.product);

    const updated = await ProductReview.findById(id)
      .populate("product", "name")
      .populate("approvedBy", "name email");

    return NextResponse.json({
      review: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
});

export const DELETE = requireAdmin(async (request, { params }) => {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    await dbConnect();

    const review = await ProductReview.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    // Recalculate product ratings
    await updateProductRatings(review.product);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
});
