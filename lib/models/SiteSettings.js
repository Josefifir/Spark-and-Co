import mongoose from "mongoose";

/**
 * Singleton document (key = "referral") that stores admin-configurable
 * referral programme settings.
 */
const SiteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },

    // Referral programme
    referralBaseUrl: { type: String, default: "" },
    referralRewardCents: { type: Number, default: 1000, min: 0 }, // credit awarded to referrer
    referralMinOrderCents: { type: Number, default: 0, min: 0 }, // min new-customer order to unlock award
  },
  { timestamps: true }
);

if (mongoose.models.SiteSettings) {
  delete mongoose.models.SiteSettings;
}

export default mongoose.model("SiteSettings", SiteSettingsSchema);
