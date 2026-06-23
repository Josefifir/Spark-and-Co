import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Categories";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  priceCents: z.number().int().min(0).optional(),
  images: z.array(z.string().min(1).max(500)).optional(),
  category: z.string().min(1).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
  ageRestricted: z.boolean().optional(),
  bulkPricingTiers: z.array(z.object({
    minQuantity: z.number().int().min(2),
    discountPercent: z.number().min(0).max(100)
  })).optional(),
});

export const GET = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  const product = await Product.findById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
});

export const PATCH = requireAdmin(async (request, { params }) => {
  let data;
  try {
    data = UpdateSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid data", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  if (data.category) {
    const categoryExists = await Category.findOne({ slug: data.category, isActive: true });
    if (!categoryExists) {
      return NextResponse.json(
        { error: "That category doesn't exist. Create it first from the Categories page." },
        { status: 400 }
      );
    }
  }

  const { id } = await params;

  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ product });
});

export const DELETE = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
});