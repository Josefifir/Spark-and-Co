/**
 * scripts/setup-totp.js
 *
 * Run ONCE to enable TOTP on the admin account.
 *
 * Usage (from project root):
 *   npm run setup:totp
 *
 * It will:
 *   1. Connect to MongoDB
 *   2. Find the admin account (ADMIN_EMAIL from .env.local)
 *   3. Generate a new TOTP secret encrypted with TOTP_ENCRYPTION_KEY
 *   4. Save it to the database and print the QR code URL to scan
 *
 * After running, scan the QR code with Google Authenticator, Aegis, or any TOTP app.
 */

require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

// Dynamically import the ES-module TOTP helpers via async require workaround
async function main() {
  const { generateTotpSecret } = await import("../lib/auth/totp.js");

  const MONGODB_URI = process.env.MONGODB_URI;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if (!MONGODB_URI) { console.error("❌  Missing MONGODB_URI in .env.local"); process.exit(1); }
  if (!ADMIN_EMAIL)  { console.error("❌  Missing ADMIN_EMAIL in .env.local");  process.exit(1); }
  if (!process.env.TOTP_ENCRYPTION_KEY) {
    console.error("❌  Missing TOTP_ENCRYPTION_KEY in .env.local"); process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB.");

  // Inline schema so this script has no circular-import issues
  const AdminUserSchema = new mongoose.Schema({
    email:       String,
    totpSecret:  { type: String, default: null },
    totpEnabled: { type: Boolean, default: false },
  }, { strict: false });

  const AdminUser = mongoose.models.AdminUser ||
    mongoose.model("AdminUser", AdminUserSchema);

  const admin = await AdminUser.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    console.error(`❌  No admin found with email: ${ADMIN_EMAIL}`);
    console.error("    Run: npm run seed:admin  first.");
    process.exit(1);
  }

  if (admin.totpEnabled) {
    console.log("ℹ️   TOTP is already enabled for this account.");
    console.log("    To reset it, set totpEnabled=false in MongoDB first, then re-run.");
    process.exit(0);
  }

  const { secret, encrypted, otpauthUrl } = generateTotpSecret(admin.email);

  admin.totpSecret  = encrypted;
  admin.totpEnabled = true;
  await admin.save();

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthUrl)}`;

  console.log("\n✅  TOTP secret generated and saved to database.\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Backup secret (base32) — store this safely:");
  console.log("  " + secret);
  console.log("\nScan this URL in your browser to get the QR code:");
  console.log("  " + qrUrl);
  console.log("\nOr add manually — otpauth URI:");
  console.log("  " + otpauthUrl);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n⚠️   Once you've scanned the QR code, delete this output from your terminal.");

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
