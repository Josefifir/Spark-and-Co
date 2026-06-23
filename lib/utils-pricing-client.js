// Client-safe pricing utilities (no database/Mongoose dependencies)
// These functions can be safely imported in client components

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

// Made with Bob
