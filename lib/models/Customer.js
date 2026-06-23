import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SavedAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      index: true 
    },
    password: { 
      type: String, 
      required: true,
      select: false // Don't include password in queries by default
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    
    // Saved addresses for faster checkout
    savedAddresses: { type: [SavedAddressSchema], default: [] },
    
    // Account status
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    
    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    
    // Preferences
    marketingOptIn: { type: Boolean, default: false },
    preferredCurrency: { type: String, enum: ["usd", "eur"], default: "usd" },
    preferredLocale: { type: String, enum: ["en", "de"], default: "en" },
    
    // Metadata
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      }
    }
  }
);

// Hash password before saving
CustomerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Method to get full name
CustomerSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

// Method to get default address
CustomerSchema.methods.getDefaultAddress = function () {
  return this.savedAddresses.find(addr => addr.isDefault) || this.savedAddresses[0] || null;
};

// Static method to find by email
CustomerSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Delete cached model to force reload
if (mongoose.models.Customer) {
  delete mongoose.models.Customer;
}

export default mongoose.model("Customer", CustomerSchema);

// Made with Bob