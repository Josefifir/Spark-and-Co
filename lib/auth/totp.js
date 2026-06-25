/**
 * TOTP helpers — AES-256-GCM encryption at rest, otpauth for code generation/verification.
 *
 * Encryption format (all colon-separated, hex-encoded):
 *   <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import * as OTPAuth from "otpauth";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX   = process.env.TOTP_ENCRYPTION_KEY;

function getKey() {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return Buffer.from(KEY_HEX, "hex");
}

export function encryptTotpSecret(plaintext) {
  const key = getKey();
  const iv  = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), ct.toString("hex")].join(":");
}

export function decryptTotpSecret(stored) {
  const [ivHex, tagHex, ctHex] = stored.split(":");
  if (!ivHex || !tagHex || !ctHex) throw new Error("Invalid TOTP ciphertext format.");
  const key      = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(ctHex, "hex")).toString("utf8") + decipher.final("utf8");
}

/**
 * Generate a new TOTP secret and return:
 *   - secret: the raw base32 string (show to user / encode in QR)
 *   - encrypted: the AES-GCM ciphertext to store in MongoDB
 *   - otpauthUrl: the otpauth:// URI for QR code generation
 */
export function generateTotpSecret(accountEmail, issuer = "Strike & Co. Admin") {
  const totp = new OTPAuth.TOTP({
    issuer,
    label:     accountEmail,
    algorithm: "SHA1",
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.generate(20), // 160-bit secret
  });
  const secret    = totp.secret.base32;
  const encrypted = encryptTotpSecret(secret);
  return { secret, encrypted, otpauthUrl: totp.toString() };
}

/**
 * Verify a 6-digit TOTP code against an encrypted stored secret.
 * Accepts a ±1 window (30 s before/after) to account for clock drift.
 */
export function verifyTotpCode(encryptedSecret, code) {
  let plain;
  try {
    plain = decryptTotpSecret(encryptedSecret);
  } catch {
    return false;
  }
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromBase32(plain),
  });
  // delta: null = invalid, 0 = current window, ±1 = adjacent windows
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
