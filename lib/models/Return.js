import mongoose from "mongoose";

const ReturnSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    items: [
      {
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        reason: { type: String, required: true, maxlength: 500 },
      }
    ],
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "label_sent", "received", "refunded"],
      default: "requested",
      index: true,
    },
    adminNote: { type: String, maxlength: 1000 },
    returnLabelUrl: { type: String },
    refundAmountCents: { type: Number, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Return || mongoose.model("Return", ReturnSchema);
