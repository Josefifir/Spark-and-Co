import crypto from "crypto";

/**
 * BTCPay Server signs webhooks with HMAC-SHA256 of the raw body
 * using the webhook secret, sent in the BTCPay-Sig header as
 * "sha256=<hex_digest>".
 *
 * Docs: https://docs.btcpayserver.org/API/Greenfield/v1/#tag/Webhooks
 */
export function verifyBtcpayWebhookSignature(rawBody, sigHeader) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("BTCPAY_WEBHOOK_SECRET is not set.");
  if (!sigHeader) return false;

  // Header format: "sha256=<hex>"
  const prefix = "sha256=";
  if (!sigHeader.startsWith(prefix)) return false;
  const givenHex = sigHeader.slice(prefix.length);

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(givenHex, "hex");
  if (expectedBuf.length !== givenBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, givenBuf);
}
