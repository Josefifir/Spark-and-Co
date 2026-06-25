import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Categories";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { slugify } from "@/lib/utils-shop";

const ProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priceCents: z.number().int().min(0),
  images: z.array(z.string().min(1).max(500)).default([]),
  category: z.string().min(1).max(100),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
  ageRestricted: z.boolean().default(true),
  bulkPricingTiers: z.array(z.object({
    minQuantity: z.number().int().min(2),
    discountPercent: z.number().min(0).max(100)
  })).optional().default([]),
  salePriceCents: z.number().int().min(0).nullable().optional(),
  saleEndsAt: z.string().datetime().nullable().optional(),
});

export const GET = requireAdmin(async () => {
  await dbConnect();
  const products = await Product.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ products });
});

export const POST = requireAdmin(async (request) => {
  let data;
  try {
    data = ProductSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid product data", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  const categoryExists = await Category.findOne({ slug: data.category, isActive: true });
  if (!categoryExists) {
    return NextResponse.json(
      { error: "That category doesn't exist. Create it first from the Categories page." },
      { status: 400 }
    );
  }

  const slug = slugify(data.name) + "-" + Math.random().toString(36).slice(2, 7);

  try {
    const product = await Product.create({ ...data, slug });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "A product with that SKU already exists." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
});