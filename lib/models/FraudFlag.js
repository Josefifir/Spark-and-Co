import mongoose from "mongoose";

const FraudFlagSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    ip: { type: String },
    score: { type: Number, required: true },
    flags: [{ type: String }],
    // Admin review
    reviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, maxlength: 500 },
    resolution: { type: String, enum: ["approved", "rejected", "escalated"], default: null },
  },
  { timestamps: true }
);

FraudFlagSchema.index({ reviewed: 1, createdAt: -1 });

export default mongoose.models.FraudFlag || mongoose.model("FraudFlag", FraudFlagSchema);
