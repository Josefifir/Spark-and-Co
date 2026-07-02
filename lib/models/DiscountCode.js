import mongoose from "mongoose";

const DiscountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 20,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed_amount", "gift_card"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          if (this.discountType === "percentage") return v <= 100;
          if (this.discountType === "fixed_amount") return v <= 999999;
          if (this.discountType === "gift_card") return v <= 999999;
          return true;
        },
        message: "Discount value invalid for type",
      },
    },
    // Gift card: remaining balance in cents (decremented on each use)
    remainingBalanceCents: { type: Number, min: 0, default: null },
    maxUsageCount: { type: Number, min: 1 }, // null = unlimited
    usageCount: { type: Number, default: 0, min: 0 },
    minimumOrderCents: { type: Number, default: 0, min: 0 },
    applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: String, lowercase: true }],
    startsAt: { type: Date },    // scheduled activation (null = active immediately)
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DiscountCodeSchema.index({ code: 1, isActive: 1 });

export default mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", DiscountCodeSchema);
