/**
 * scripts/setup-totp.js
 *
 * Run ONCE after deployment to enable TOTP on the admin account.
 * It will:
 *   1. Connect to MongoDB
 *   2. Find the admin account (ADMIN_EMAIL)
 *   3. Generate a new TOTP secret
 *   4. Print the otpauth:// URI and a QR-code ASCII link to scan with your authenticator app
 *   5. Save the encrypted secret to the database
 *   6. Set totpEnabled = true
 *
 * Usage:
 *   node scripts/setup-totp.js
 *
 * After running, scan the QR code with Google Authenticator, Aegis, or any TOTP app.
 * The secret is stored encrypted in MongoDB — keep TOTP_ENCRYPTION_KEY safe.
 */

import "dotenv/config";
import mongoose from "mongoose";
import { generateTotpSecret } from "../lib/auth/totp.js";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!MONGODB_URI) { console.error("Missing MONGODB_URI"); process.exit(1); }
if (!ADMIN_EMAIL)  { console.error("Missing ADMIN_EMAIL"); process.exit(1); }

// Inline model to avoid ES module circular-import issues in a plain script
const AdminUserSchema = new mongoose.Schema({
  email:       String,
  totpSecret:  { type: String, default: null },
  totpEnabled: { type: Boolean, default: false },
}, { strict: false });
const AdminUser = mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const admin = await AdminUser.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    console.error(`No admin found with email: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  if (admin.totpEnabled) {
    console.log("TOTP is already enabled for this account.");
    console.log("To reset it, set totpEnabled=false in MongoDB first.");
    process.exit(0);
  }

  const { secret, encrypted, otpauthUrl } = generateTotpSecret(admin.email);

  admin.totpSecret  = encrypted;
  admin.totpEnabled = true;
  await admin.save();

  console.log("\n✅  TOTP secret generated and saved.\n");
  console.log("Secret (base32):", secret);
  console.log("\notpauth URI (paste into your app or generate a QR code):");
  console.log(otpauthUrl);
  console.log("\nOr scan this QR code URL in your browser:");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthUrl)}`;
  console.log(qrUrl);
  console.log("\n⚠️  Store the secret somewhere safe as a backup.");

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
