import mongoose from "mongoose";

const BulkPricingTierSchema = new mongoose.Schema(
  {
    minQuantity: { type: Number, required: true, min: 2 },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },
    priceCents: { type: Number, required: true, min: 0 }, // store money as integer cents
    currency: { type: String, default: "usd" },
    images: [{ type: String }], // URLs
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: "classic",
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    ageRestricted: { type: Boolean, default: true },
    bulkPricingTiers: {
      type: [BulkPricingTierSchema],
      default: [],
      validate: (v) => {
        if (v.length === 0) return true;
        for (let i = 1; i < v.length; i++) {
          if (v[i].minQuantity <= v[i - 1].minQuantity) return false;
        }
        return true;
      },
    },
    relatedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    averageRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text" });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
