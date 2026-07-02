import { dbConnect } from "./db.js";
import DiscountCode from "./models/DiscountCode.js";

export async function validateDiscountCode(
  code,
  subtotalCents,
  cartItemProductIds = []
) {
  try {
    await dbConnect();

    const normalizedCode = code.toUpperCase().trim();
    const now = new Date();
    // Include expiry check in the DB query so an expired-but-still-isActive
    // code is rejected at the source rather than after a cache hit.
    const discountCode = await DiscountCode.findOne({
      code: normalizedCode,
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    });

    if (!discountCode) {
      return {
        valid: false,
        error: "Invalid or expired discount code",
        discountCents: 0,
      };
    }

    if (
      discountCode.maxUsageCount &&
      discountCode.usageCount >= discountCode.maxUsageCount
    ) {
      return {
        valid: false,
        error: "Discount code usage limit reached",
        discountCents: 0,
      };
    }

    if (subtotalCents < discountCode.minimumOrderCents) {
      return {
        valid: false,
        error: `Minimum order of $${(discountCode.minimumOrderCents / 100).toFixed(2)} required`,
        discountCents: 0,
      };
    }

    // Check if applicable to products
    if (
      discountCode.applicableProductIds.length > 0 ||
      discountCode.applicableCategories.length > 0
    ) {
      const applicableIds = discountCode.applicableProductIds.map((id) =>
        id.toString()
      );
      const cartIds = cartItemProductIds.map((id) => id.toString());

      const hasApplicableProduct =
        applicableIds.length > 0 &&
        cartIds.some((id) => applicableIds.includes(id));
      const hasApplicableCategory =
        discountCode.applicableCategories.length > 0;

      if (!hasApplicableProduct && !hasApplicableCategory) {
        return {
          valid: false,
          error: "This discount code is not applicable to items in your cart",
          discountCents: 0,
        };
      }
    }

    // Calculate discount
    let discountCents = 0;
    if (discountCode.discountType === "percentage") {
      discountCents = Math.floor(subtotalCents * (discountCode.discountValue / 100));
    } else if (discountCode.discountType === "fixed_amount") {
      discountCents = Math.min(discountCode.discountValue, subtotalCents);
    } else if (discountCode.discountType === "gift_card") {
      const available = discountCode.remainingBalanceCents ?? discountCode.discountValue;
      discountCents = Math.min(available, subtotalCents);
    }

    return {
      valid: true,
      code: normalizedCode,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      discountCents,
      error: null,
    };
  } catch (error) {
    console.error("Error validating discount code:", error);
    return {
      valid: false,
      error: "Error validating discount code",
      discountCents: 0,
    };
  }
}

export async function incrementDiscountCodeUsage(code, discountAppliedCents = 0) {
  try {
    await dbConnect();
    const upperCode = code.toUpperCase();

    if (discountAppliedCents > 0) {
      // Gift card: atomically deduct balance, ensuring it never goes below 0.
      // $inc with a negative value guarded by a $gte condition prevents double-spend
      // under concurrent requests.
      const updated = await DiscountCode.findOneAndUpdate(
        {
          code: upperCode,
          discountType: "gift_card",
          remainingBalanceCents: { $gte: discountAppliedCents },
        },
        {
          $inc: { usageCount: 1, remainingBalanceCents: -discountAppliedCents },
        },
        { new: true }
      );

      if (updated && updated.remainingBalanceCents === 0) {
        await DiscountCode.updateOne({ code: upperCode }, { isActive: false });
      }

      // For non-gift-card codes, fall through to the simple increment below.
      if (updated) return;
    }

    // Non-gift-card: just bump the usage counter atomically.
    await DiscountCode.updateOne(
      { code: upperCode },
      { $inc: { usageCount: 1 } }
    );
  } catch (error) {
    console.error("Error incrementing discount code usage:", error);
  }
}

export function findApplicableBulkTier(quantity, bulkPricingTiers) {
  if (!bulkPricingTiers || bulkPricingTiers.length === 0) {
    return null;
  }

  for (let i = bulkPricingTiers.length - 1; i >= 0; i--) {
    if (quantity >= bulkPricingTiers[i].minQuantity) {
      return bulkPricingTiers[i];
    }
  }

  return null;
}

export function calculateBulkPrice(priceCents, quantity, bulkPricingTiers) {
  const tier = findApplicableBulkTier(quantity, bulkPricingTiers);

  if (!tier) {
    return {
      unitPriceCents: priceCents,
      totalPriceCents: priceCents * quantity,
      discountPercent: 0,
      bulkApplied: false,
    };
  }

  const discountMultiplier = 1 - tier.discountPercent / 100;
  const discountedPrice = Math.floor(priceCents * discountMultiplier);

  return {
    unitPriceCents: discountedPrice,
    totalPriceCents: discountedPrice * quantity,
    discountPercent: tier.discountPercent,
    bulkApplied: true,
  };
}

export function calculateMaxSavings(priceCents, bulkPricingTiers) {
  if (!bulkPricingTiers || bulkPricingTiers.length === 0) {
    return null;
  }

  const maxTier = bulkPricingTiers[bulkPricingTiers.length - 1];
  const maxDiscount = maxTier.discountPercent;

  return {
    percent: maxDiscount,
    at100Units: Math.floor(priceCents * 100 * (1 - maxDiscount / 100)),
  };
}
