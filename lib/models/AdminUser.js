import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin" },
    role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date },
    // TOTP: stored as AES-256-GCM ciphertext — never plaintext in DB
    totpSecret: { type: String, default: null },
    totpEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AdminUserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

AdminUserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

AdminUserSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

export default mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
