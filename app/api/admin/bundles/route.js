import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Bundle from "@/lib/models/Bundle";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const BundleSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      product: z.string().min(1),
      quantity: z.number().int().min(1).default(1),
    })
  ).min(2),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().min(0),
  image: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const GET = requireAdmin(async () => {
  await dbConnect();
  const bundles = await Bundle.find({}).populate("items.product", "name priceCents images slug").sort({ createdAt: -1 }).lean();
  return NextResponse.json({ bundles });
});

export const POST = requireAdmin(async (request) => {
  let body;
  try { body = BundleSchema.parse(await request.json()); }
  catch (err) { return NextResponse.json({ error: "Invalid data", details: err.errors?.map(e => e.message) }, { status: 400 }); }

  await dbConnect();

  // Verify all products exist
  const ids = body.items.map(i => i.product);
  const products = await Product.find({ _id: { $in: ids } }).select("_id").lean();
  if (products.length !== ids.length) {
    return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
  }

  const bundle = await Bundle.create(body);
  return NextResponse.json({ bundle }, { status: 201 });
});
