/**
 * Lightweight fraud risk scoring.
 * Returns a score 0–100 and a list of flags.
 * Orders scoring ≥ 70 are auto-held for manual review.
 *
 * No external service required — pure logic + optional IP lookup.
 */

// High-risk TLDs and email patterns (extend as needed)
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", "throwam.com",
  "dispostable.com", "yopmail.com", "trashmail.com", "fakeinbox.com",
]);

/**
 * Score an order for fraud risk.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.ip
 * @param {string} params.shippingCountry  ISO-2
 * @param {string} [params.billingCountry] ISO-2 (from Stripe metadata if available)
 * @param {number} params.totalCents
 * @param {number} params.recentOrderCount  orders from this email in the last 60 min
 * @returns {{ score: number, flags: string[] }}
 */
export function scoreOrder({ email, shippingCountry, billingCountry, totalCents, recentOrderCount = 0 }) {
  let score = 0;
  const flags = [];

  // ── Disposable email ──────────────────────────────────────────────────────
  const domain = (email || "").split("@")[1]?.toLowerCase();
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    score += 40;
    flags.push("disposable_email");
  }

  // ── Velocity check ────────────────────────────────────────────────────────
  if (recentOrderCount >= 3) {
    score += 30;
    flags.push(`velocity_${recentOrderCount}_orders_per_hour`);
  } else if (recentOrderCount >= 2) {
    score += 15;
    flags.push(`velocity_${recentOrderCount}_orders_per_hour`);
  }

  // ── High value order ──────────────────────────────────────────────────────
  if (totalCents >= 50_000) { // ≥ $500
    score += 10;
    flags.push("high_value_order");
  }
  if (totalCents >= 100_000) { // ≥ $1000 (additive)
    score += 10;
    flags.push("very_high_value_order");
  }

  // ── Billing ≠ Shipping country ────────────────────────────────────────────
  if (billingCountry && shippingCountry && billingCountry !== shippingCountry) {
    score += 15;
    flags.push("billing_shipping_country_mismatch");
  }

  // ── High-risk shipping destinations ───────────────────────────────────────
  // Add / adjust this list based on your actual chargeback history
  const HIGH_RISK_COUNTRIES = new Set(["NG", "GH", "RO", "UA"]);
  if (HIGH_RISK_COUNTRIES.has(shippingCountry)) {
    score += 10;
    flags.push("high_risk_shipping_country");
  }

  return { score: Math.min(100, score), flags };
}
