import mongoose from "mongoose";

const ProductQASchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    askerEmail: { type: String, required: true, lowercase: true, trim: true },
    askerName: { type: String, trim: true, maxlength: 100 },
    answer: { type: String, trim: true, maxlength: 2000, default: null },
    answeredAt: { type: Date, default: null },
    isPublished: { type: Boolean, default: false }, // published once admin answers
  },
  { timestamps: true }
);

ProductQASchema.index({ product: 1, isPublished: 1 });

export default mongoose.models.ProductQA || mongoose.model("ProductQA", ProductQASchema);
