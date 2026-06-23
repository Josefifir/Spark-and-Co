import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/Categories";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { slugify } from "@/lib/utils-shop";

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().default(true),
});

export const GET = requireAdmin(async () => {
  await dbConnect();
  const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  return NextResponse.json({ categories });
});

export const POST = requireAdmin(async (request) => {
  let data;
  try {
    data = CategorySchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid category data", details: err.errors?.map((e) => e.message) },
      { status: 400 }
    );
  }

  await dbConnect();

  const baseSlug = slugify(data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await Category.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  try {
    const category = await Category.create({ ...data, slug });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
});