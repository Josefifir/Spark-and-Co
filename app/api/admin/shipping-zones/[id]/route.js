import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import ShippingZone from "@/lib/models/ShippingZone";
import { requireAdmin } from "@/lib/auth/requireAdmin";

// GET /api/admin/shipping-zones/[id] - Get single shipping zone
export const GET = requireAdmin(async (_req, { params }) => {
  await dbConnect();
  const zone = await ShippingZone.findById(params.id);
  if (!zone) {
    return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
  }
  return NextResponse.json({ zone });
});

// Zod schema for allowed update fields
const ShippingRateUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  type: z.enum(["flat_rate", "free", "weight_based", "price_based"]).optional(),
  flatRate: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  weightRanges: z.array(z.object({
    minWeight: z.number().min(0),
    maxWeight: z.number().min(0),
    rate: z.number().min(0),
  })).optional(),
  priceRanges: z.array(z.object({
    minPrice: z.number().min(0),
    maxPrice: z.number().min(0),
    rate: z.number().min(0),
  })).optional(),
  estimatedMinDays: z.number().int().min(0).optional(),
  estimatedMaxDays: z.number().int().min(0).optional(),
  carrier: z.enum(["dhl", "dpd", "ups", "fedex", "usps", "royal_mail", "other"]).optional(),
  carrierService: z.string().max(100).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
});

const ShippingZoneUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  countries: z.array(z.string().length(2)).min(1).optional(),
  regions: z.array(z.object({
    country: z.string().length(2),
    states: z.array(z.string()),
  })).optional(),
  postalCodes: z.array(z.object({
    country: z.string().length(2),
    patterns: z.array(z.string()),
  })).optional(),
  rates: z.array(ShippingRateUpdateSchema).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional(),
});

// PATCH /api/admin/shipping-zones/[id] - Update shipping zone
export const PATCH = requireAdmin(async (request, { params }) => {
  await dbConnect();

  let data;
  try {
    data = ShippingZoneUpdateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid update data.", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  const zone = await ShippingZone.findByIdAndUpdate(
    params.id,
    data,
    { new: true, runValidators: true }
  );

  if (!zone) {
    return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
  }

  return NextResponse.json({ zone });
});

// DELETE /api/admin/shipping-zones/[id] - Delete shipping zone
export const DELETE = requireAdmin(async (_req, { params }) => {
  await dbConnect();

  const zone = await ShippingZone.findByIdAndDelete(params.id);

  if (!zone) {
    return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Shipping zone deleted successfully" });
});

// Made with Bob
