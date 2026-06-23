import crypto from "crypto";

/**
 * Coinbase Commerce signs webhooks with HMAC-SHA256 of the raw body
 * using the shared webhook secret, sent in the X-CC-Webhook-Signature header.
 */
export function verifyCoinbaseWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) throw new Error("COINBASE_COMMERCE_WEBHOOK_SECRET is not set.");
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== givenBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
