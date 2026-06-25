import mongoose from "mongoose";

const ProductReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    reviewToken: {
      type: String,
      index: true,
      sparse: true, // Only index non-null values
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      maxlength: 500,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
    approvedAt: Date,
    rejectedAt: Date,
    flaggedAsInappropriate: {
      type: Boolean,
      default: false,
    },
    flagCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ProductReviewSchema.index({ product: 1, status: 1 });
// customerEmail already has index: true on the field definition above — no need to repeat

export default mongoose.models.ProductReview ||
  mongoose.model("ProductReview", ProductReviewSchema);
