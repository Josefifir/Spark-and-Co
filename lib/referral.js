import { randomBytes } from "crypto";
import Customer from "@/lib/models/Customer";
import Order from "@/lib/models/Order";

// Store credit awarded per successful referral, in cents (default $10.00)
export const REFERRAL_CREDIT_CENTS = parseInt(process.env.REFERRAL_CREDIT_CENTS || "1000", 10);

/**
 * Generate a unique 8-character alphanumeric referral code.
 */
export function generateReferralCode() {
  return randomBytes(5).toString("base64url").slice(0, 8).toUpperCase();
}

/**
 * Ensure a customer has a referral code, generating one if missing.
 * Returns the code.
 */
export async function ensureReferralCode(customer) {
  if (customer.referralCode) return customer.referralCode;

  // Collision-safe: retry until unique
  let code;
  for (let i = 0; i < 5; i++) {
    code = generateReferralCode();
    const existing = await Customer.findOne({ referralCode: code }).lean();
    if (!existing) break;
  }
  customer.referralCode = code;
  await customer.save();
  return code;
}

/**
 * Look up the referrer from a referral code string.
 * Returns the Customer document or null.
 */
export async function getReferrerByCode(code) {
  if (!code) return null;
  return Customer.findOne({ referralCode: code.toUpperCase() });
}

/**
 * Award referral store credit to the referrer after a confirmed paid order.
 * Safe to call multiple times — idempotent via referralCreditAwarded flag.
 *
 * @param {string} orderId  - Mongo ObjectId string of the paid order
 */
export async function awardReferralCredit(orderId) {
  const order = await Order.findById(orderId);
  if (!order || !order.referralCode || order.referralCreditAwarded) return;

  const referrer = await Customer.findOne({ referralCode: order.referralCode });
  if (!referrer) return;

  // Prevent self-referral double-check (belt + braces)
  if (referrer._id.toString() === order.customer?.toString()) return;

  await Customer.updateOne(
    { _id: referrer._id },
    { $inc: { referralCreditsCents: REFERRAL_CREDIT_CENTS, referralCount: 1 } }
  );

  await Order.updateOne({ _id: order._id }, { referralCreditAwarded: true });
}

/**
 * Build the public referral URL for a given code.
 */
export function getReferralUrl(code) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base}/?ref=${code}`;
}
