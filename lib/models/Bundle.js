import mongoose from "mongoose";

const BundleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const BundleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, maxlength: 1000 },
    items: { type: [BundleItemSchema], required: true, validate: (v) => v.length >= 2 },
    // Discount applied to the bundle total
    discountType: { type: String, enum: ["percentage", "fixed_amount"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    image: { type: String }, // optional override image
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Bundle || mongoose.model("Bundle", BundleSchema);
