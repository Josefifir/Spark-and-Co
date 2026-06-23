import mongoose from "mongoose";

const CookieConsentSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
    
    // Consent categories
    necessary: { type: Boolean, default: true }, // Always true, can't be disabled
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    preferences: { type: Boolean, default: false },
    
    // Metadata
    consentVersion: { type: String, default: "1.0" },
    locale: { type: String, default: "en" },
    
    // Timestamps
    consentedAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CookieConsentSchema.index({ sessionId: 1, consentedAt: -1 });

export default mongoose.models.CookieConsent ||
  mongoose.model("CookieConsent", CookieConsentSchema);

// Made with Bob
