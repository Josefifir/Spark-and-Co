import mongoose from "mongoose";

const FollowUpEmailSchema = new mongoose.Schema(
  {
    orderId:       { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customerEmail: { type: String, required: true },
    orderNumber:   { type: String, required: true },
    type:          { type: String, enum: ["care_guide", "check_in", "restock"], required: true },
    subject:       { type: String, required: true },
    scheduledFor:  { type: Date,   required: true, index: true },
    sent:          { type: Boolean, default: false, index: true },
    sentAt:        { type: Date },
  },
  { timestamps: true }
);

FollowUpEmailSchema.index({ orderId: 1, type: 1 }, { unique: true });

export default mongoose.models.FollowUpEmail ||
  mongoose.model("FollowUpEmail", FollowUpEmailSchema);
