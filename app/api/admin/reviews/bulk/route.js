import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import ProductReview from "@/lib/models/ProductReview";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateProductRatings } from "@/lib/reviews/updateProductRatings";
import { z } from "zod";
import { ObjectId } from "mongodb";

const BulkActionSchema = z.object({
  reviewIds: z.array(z.string()).min(1, "At least one review ID is required").max(100, "Maximum 100 reviews at once"),
  action: z.enum(["approve", "reject", "delete"]),
  adminNote: z.string().max(500).optional(),
});

export const POST = requireAdmin(async (request, context, session) => {
  try {
    const body = await request.json();
    const validated = BulkActionSchema.parse(body);

    // Validate all review IDs
    const invalidIds = validated.reviewIds.filter(id => !ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid review IDs: ${invalidIds.join(", ")}` },
        { status: 400 }
      );
    }

    await dbConnect();

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      affectedProducts: new Set(),
    };

    // Process each review
    for (const reviewId of validated.reviewIds) {
      try {
        const review = await ProductReview.findById(reviewId);
        
        if (!review) {
          results.failed++;
          results.errors.push({
            reviewId,
            error: "Review not found",
          });
          continue;
        }

        // Track product for rating recalculation
        results.affectedProducts.add(review.product.toString());

        if (validated.action === "delete") {
          await ProductReview.findByIdAndDelete(reviewId);
          results.success++;
        } else if (validated.action === "approve") {
          review.status = "approved";
          review.approvedBy = session._id;
          review.approvedAt = new Date();
          review.rejectedAt = null;
          review.adminNote = null;
          await review.save();
          results.success++;
        } else if (validated.action === "reject") {
          review.status = "rejected";
          review.rejectedAt = new Date();
          review.adminNote = validated.adminNote || null;
          review.approvedBy = null;
          review.approvedAt = null;
          await review.save();
          results.success++;
        }
      } catch (error) {
        console.error(`Error processing review ${reviewId}:`, error);
        results.failed++;
        results.errors.push({
          reviewId,
          error: error.message || "Unknown error",
        });
      }
    }

    // Recalculate ratings for all affected products
    const productIds = Array.from(results.affectedProducts);
    for (const productId of productIds) {
      try {
        await updateProductRatings(productId);
      } catch (error) {
        console.error(`Error updating ratings for product ${productId}:`, error);
      }
    }

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      errors: results.errors,
      affectedProducts: productIds,
      message: `Successfully processed ${results.success} review(s). ${results.failed > 0 ? `${results.failed} failed.` : ""}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error processing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
});

// Made with Bob
