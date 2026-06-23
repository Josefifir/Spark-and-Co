import { dbConnect } from "@/lib/db";
import ProductReview from "@/lib/models/ProductReview";
import Product from "@/lib/models/Product";

export async function updateProductRatings(productId) {
  try {
    await dbConnect();

    // Calculate average rating and count from approved reviews
    const stats = await ProductReview.aggregate([
      {
        $match: {
          product: productId,
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const productUpdate = {};

    if (stats.length > 0) {
      const { averageRating, reviewCount } = stats[0];
      // Round to 1 decimal place
      productUpdate.averageRating = Math.round(averageRating * 10) / 10;
      productUpdate.reviewCount = reviewCount;
    } else {
      // No approved reviews, clear ratings
      productUpdate.averageRating = null;
      productUpdate.reviewCount = 0;
    }

    await Product.findByIdAndUpdate(productId, productUpdate);
  } catch (error) {
    console.error("Error updating product ratings:", error);
    throw error;
  }
}
