import mongoose from "mongoose";

const BackInStockSubscriptionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    notificationSent: { type: Boolean, default: false },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

BackInStockSubscriptionSchema.index({ productId: 1, email: 1 }, { unique: true });

export default mongoose.models.BackInStockSubscription ||
  mongoose.model("BackInStockSubscription", BackInStockSubscriptionSchema);
