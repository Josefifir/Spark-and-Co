import mongoose from "mongoose";

const AbandonedCartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true }, // anonymous identifier stored in localStorage
    customerEmail: { type: String, lowercase: true, trim: true, index: true }, // set if known
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        priceCents: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
        slug: { type: String },
      },
    ],
    discountCode: { type: String }, // optional — populated from recovery email
    recoveryEmailSentAt: { type: Date, default: null },
    recoveredAt: { type: Date, default: null }, // set when customer completes checkout
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// TTL index — automatically purge carts older than 7 days
AbandonedCartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
AbandonedCartSchema.index({ recoveryEmailSentAt: 1 });
AbandonedCartSchema.index({ recoveredAt: 1 });

export default mongoose.models.AbandonedCart ||
  mongoose.model("AbandonedCart", AbandonedCartSchema);
