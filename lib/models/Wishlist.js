import mongoose from "mongoose";
import crypto from "crypto";

const WishlistSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product",  required: true },
    shareToken:   { type: String, sparse: true, index: true }, // per-customer share token
    shareTokenExp: { type: Date }, // expiry for the share token
  },
  { timestamps: true }
);

WishlistSchema.index({ customer: 1, product: 1 }, { unique: true });

/** Generate a secure share token valid for 7 days for a given customerId */
WishlistSchema.statics.generateShareToken = function (customerId) {
  const secret = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || "secret";
  const payload = `${customerId}:${Date.now()}`;
  const token = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  const exp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, exp };
};

export default mongoose.models.Wishlist ||
  mongoose.model("Wishlist", WishlistSchema);
