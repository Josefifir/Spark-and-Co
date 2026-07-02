import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product",  required: true },
  },
  { timestamps: true }
);

WishlistSchema.index({ customer: 1, product: 1 }, { unique: true });

export default mongoose.models.Wishlist ||
  mongoose.model("Wishlist", WishlistSchema);
