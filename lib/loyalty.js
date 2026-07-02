/**
 * Loyalty points utilities
 * 
 * Earn rate: 1 point per $1 spent (configurable via LOYALTY_POINTS_PER_DOLLAR env var)
 * Redemption: 100 points = $1 (i.e. 1 point = 1 cent)
 */
import { dbConnect } from "@/lib/db";

const POINTS_PER_DOLLAR = parseInt(process.env.LOYALTY_POINTS_PER_DOLLAR || "1", 10);

/**
 * Calculate points earned for a given order total (in cents)
 */
export function calculatePointsEarned(totalCents) {
  return Math.floor((totalCents / 100) * POINTS_PER_DOLLAR);
}

/**
 * Award loyalty points for a completed order.
 * Safe to call multiple times — checks loyaltyPointsAwarded flag.
 */
export async function awardLoyaltyPoints(orderId) {
  await dbConnect();

  const { default: Order } = await import("@/lib/models/Order");
  const { default: Customer } = await import("@/lib/models/Customer");
  const { default: LoyaltyTransaction } = await import("@/lib/models/LoyaltyTransaction");

  const order = await Order.findById(orderId);
  if (!order) return;
  if (order.loyaltyPointsAwarded) return; // already done
  if (!order.customer) return; // guest checkout — no account to credit

  const points = calculatePointsEarned(order.totalCents);
  if (points <= 0) return;

  const customerExists = await Customer.exists({ _id: order.customer });
  if (!customerExists) return;

  // Use findOneAndUpdate to atomically increment and get the new balance in one round-trip
  const updated = await Customer.findOneAndUpdate(
    { _id: order.customer },
    { $inc: { loyaltyPoints: points, loyaltyPointsEarned: points } },
    { new: true, select: "loyaltyPoints" }
  );
  if (!updated) return;

  await LoyaltyTransaction.create({
    customer: order.customer,
    order: orderId,
    type: "earn",
    points,
    description: `Order #${order.orderNumber}`,
    balanceAfter: updated.loyaltyPoints,
  });

  await Order.updateOne(
    { _id: orderId },
    { $set: { loyaltyPointsEarned: points, loyaltyPointsAwarded: true } }
  );
}

/**
 * Redeem loyalty points at checkout.
 * Returns the discount in cents and the points consumed.
 * Points are NOT deducted here — deduction happens on order creation.
 */
export function calculateLoyaltyRedemption(pointsToRedeem, customerId) {
  if (!customerId || !pointsToRedeem || pointsToRedeem <= 0) {
    return { discountCents: 0, pointsRedeemed: 0 };
  }
  // 1 point = 1 cent
  return { discountCents: pointsToRedeem, pointsRedeemed: pointsToRedeem };
}

/**
 * Loyalty tier based on lifetime points earned.
 * Bronze  (default) : 0 – 499 pts  — 1× multiplier
 * Silver             : 500 – 1,999  — 1.5× multiplier
 * Gold               : 2,000+       — 2× multiplier
 */
export function getLoyaltyTier(lifetimeEarned = 0) {
  if (lifetimeEarned >= 2000) return { name: "Gold",   color: "#fbbf24", multiplier: 2.0, nextTier: null,   pointsToNext: 0 };
  if (lifetimeEarned >= 500)  return { name: "Silver", color: "#94a3b8", multiplier: 1.5, nextTier: "Gold",   pointsToNext: 2000 - lifetimeEarned };
  return                               { name: "Bronze", color: "#b45309", multiplier: 1.0, nextTier: "Silver", pointsToNext: 500  - lifetimeEarned };
}

/**
 * Points earned for an order, adjusted by loyalty tier multiplier.
 */
export function calculatePointsEarnedWithTier(totalCents, lifetimeEarned = 0) {
  const tier = getLoyaltyTier(lifetimeEarned);
  const base = calculatePointsEarned(totalCents);
  return Math.floor(base * tier.multiplier);
}
