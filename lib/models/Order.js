import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot at time of order
    priceCents: { type: Number, required: true }, // snapshot at time of order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [OrderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotalCents: { type: Number, required: true },
    discountAppliedCents: { type: Number, default: 0, min: 0 },
    discountCodeUsed: { type: String },
    shippingCents: { type: Number, default: 0, min: 0 },
    totalCents: { type: Number, required: true },
    currency: { type: String, default: "usd" },

    // Shipping information
    shippingMethod: {
      name: { type: String },
      carrier: { type: String },
      carrierService: { type: String },
      estimatedMinDays: { type: Number },
      estimatedMaxDays: { type: Number },
      cost: { type: Number },
    },

    // Customer reference (optional - for registered customers)
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    shippingAddress: {
      name: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    // Age verification snapshot - we never store a birthdate, just confirmation + timestamp
    ageVerifiedAt: { type: Date, required: true },

    paymentMethod: { type: String, enum: ["stripe", "bitcoin", "sepa"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    // External references only - we NEVER store card numbers, CVCs, or wallet private keys
    stripePaymentIntentId: { type: String },
    coinbaseChargeId: { type: String },
    coinbaseChargeCode: { type: String },

    fulfillmentStatus: {
      type: String,
      enum: ["unfulfilled", "processing", "shipped", "delivered", "cancelled"],
      default: "unfulfilled",
    },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    shippingLabelUrl: { type: String },
    estimatedDeliveryDate: { type: Date },
    actualDeliveryDate: { type: Date },
  },
  { timestamps: true }
);

// Delete the cached model to force reload with updated schema
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model("Order", OrderSchema);

// Made with Bob
