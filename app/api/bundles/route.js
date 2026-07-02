import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Bundle from "@/lib/models/Bundle";

export const dynamic = "force-dynamic";

// Public — list active bundles with product details
export async function GET() {
  await dbConnect();
  const bundles = await Bundle.find({ isActive: true })
    .populate("items.product", "name priceCents images slug isActive stock")
    .sort({ createdAt: -1 })
    .lean();

  // Attach computed fields: originalTotalCents, bundlePriceCents
  const enriched = bundles.map((bundle) => {
    const originalTotalCents = bundle.items.reduce((sum, item) => {
      const p = item.product;
      if (!p) return sum;
      return sum + (p.priceCents * item.quantity);
    }, 0);

    let bundlePriceCents;
    if (bundle.discountType === "percentage") {
      bundlePriceCents = Math.round(originalTotalCents * (1 - bundle.discountValue / 100));
    } else {
      bundlePriceCents = Math.max(0, originalTotalCents - bundle.discountValue);
    }
    const savingsCents = originalTotalCents - bundlePriceCents;
    const savingsPercent = originalTotalCents > 0
      ? Math.round((savingsCents / originalTotalCents) * 100)
      : 0;

    return { ...bundle, originalTotalCents, bundlePriceCents, savingsCents, savingsPercent };
  });

  return NextResponse.json({ bundles: enriched });
}
