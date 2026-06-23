/**
 * Seeds the first admin user from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local.
 * Run with: node scripts/seed-admin.js
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local");
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD should be at least 12 characters for security.");
  }

  await mongoose.connect(MONGODB_URI);

  const AdminUserSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      name: String,
      role: { type: String, default: "superadmin" },
      failedLoginAttempts: { type: Number, default: 0 },
      lockedUntil: Date,
      lastLoginAt: Date,
    },
    { timestamps: true }
  );

  const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

  const existing = await AdminUser.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`Admin user ${ADMIN_EMAIL} already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await AdminUser.create({
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    name: "Admin",
    role: "superadmin",
  });

  console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
  console.log(`   Log in at /admin/login`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌ Failed to seed admin:", err.message);
  process.exit(1);
});
