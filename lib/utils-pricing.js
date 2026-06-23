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
    const discountCode = await DiscountCode.findOne({
      code: normalizedCode,
      isActive: true,
    });

    if (!discountCode) {
      return {
        valid: false,
        error: "Invalid discount code",
        discountCents: 0,
      };
    }

    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return {
        valid: false,
        error: "Discount code has expired",
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

export async function incrementDiscountCodeUsage(code) {
  try {
    await dbConnect();
    await DiscountCode.updateOne(
      { code: code.toUpperCase() },
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
