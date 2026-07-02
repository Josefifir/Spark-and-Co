import mongoose from "mongoose";

// Points: 1 point = $0.01 of redemption value (100 points = $1)
// Default earn rate: 1 point per $1 spent (configurable in SiteSettings)
const LoyaltyTransactionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    type: {
      type: String,
      enum: ["earn", "redeem", "expire", "adjust"],
      required: true,
    },
    points: { type: Number, required: true }, // positive = earned, negative = redeemed/expired
    description: { type: String, maxlength: 200 },
    // Running balance after this transaction
    balanceAfter: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

LoyaltyTransactionSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.models.LoyaltyTransaction ||
  mongoose.model("LoyaltyTransaction", LoyaltyTransactionSchema);
