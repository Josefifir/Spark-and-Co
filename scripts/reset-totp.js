/**
 * scripts/reset-totp.js
 *
 * Clears the TOTP secret from the admin account so setup-totp.js can re-run.
 * Use this only if you've lost access to your authenticator app.
 *
 * Usage:
 *   node scripts/reset-totp.js
 */
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

  if (!MONGODB_URI) { console.error("❌  Missing MONGODB_URI"); process.exit(1); }
  if (!ADMIN_EMAIL)  { console.error("❌  Missing ADMIN_EMAIL");  process.exit(1); }

  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB.");

  const AdminUserSchema = new mongoose.Schema({
    email:       String,
    totpSecret:  { type: String, default: null },
    totpEnabled: { type: Boolean, default: false },
  }, { strict: false });

  const AdminUser = mongoose.models.AdminUser ||
    mongoose.model("AdminUser", AdminUserSchema);

  const result = await AdminUser.updateOne(
    { email: ADMIN_EMAIL.toLowerCase() },
    { $set: { totpEnabled: false, totpSecret: null } }
  );

  if (result.matchedCount === 0) {
    console.error(`❌  No admin found with email: ${ADMIN_EMAIL}`);
    process.exit(1);
  }

  console.log("✅  TOTP reset. Now run:  npm run setup:totp");
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
