import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot at time of order
    priceCents: { type: Number, required: true }, // snapshot at time of order
    quantity: { type: Number, required: true, min: 1 },
    personalisationText: { type: String, maxlength: 200, default: null }, // engraving / custom message
    isPreorder: { type: Boolean, default: false }, // was out-of-stock at time of order
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, unique: true, sparse: true }, // e.g. INV-2024-00042
    invoiceDate: { type: Date },                                  // set when payment confirmed
    billingAddress: {                                             // if different from shipping
      name:       { type: String },
      company:    { type: String },
      vatNumber:  { type: String },  // buyer's VAT-ID (B2B)
      line1:      { type: String },
      line2:      { type: String },
      city:       { type: String },
      state:      { type: String },
      postalCode: { type: String },
      country:    { type: String },
    },
    items: { type: [OrderItemSchema], required: true, validate: (v) => v.length > 0 },
    subtotalCents: { type: Number, required: true },
    discountAppliedCents: { type: Number, default: 0, min: 0 },
    discountCodeUsed: { type: String },
    referralCode: { type: String },          // referral code applied at checkout
    referralCreditAwarded: { type: Boolean, default: false }, // prevent double-awarding
    // Loyalty points
    loyaltyPointsRedeemed: { type: Number, default: 0, min: 0 },
    loyaltyDiscountCents: { type: Number, default: 0, min: 0 }, // value of redeemed points
    loyaltyPointsEarned: { type: Number, default: 0, min: 0 },  // points awarded on this order
    loyaltyPointsAwarded: { type: Boolean, default: false },     // prevent double-awarding
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

    paymentMethod: { type: String, enum: ["stripe", "bitcoin", "sepa", "revolut"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    // External references only - we NEVER store card numbers, CVCs, or wallet private keys
    stripePaymentIntentId: { type: String },
    btcpayInvoiceId: { type: String },

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

// Compound indexes for common queries
OrderSchema.index({ paymentStatus: 1, createdAt: -1 }); // Admin orders filtering
OrderSchema.index({ customerEmail: 1, createdAt: -1 }); // Customer order lookup
OrderSchema.index({ customer: 1, createdAt: -1 }); // Customer account orders
// orderNumber already has unique: true on the field — no need to repeat

// Auto-increment invoice counter using a simple approach via a separate counter doc
// (handled in lib/invoice/generateInvoicePdf.js)

// Delete the cached model to force reload with updated schema
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model("Order", OrderSchema);

// Made with Bob
