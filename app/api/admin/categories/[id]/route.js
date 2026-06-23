import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/Categories";
import Product from "@/lib/models/Product";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
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
  const { id } = await params;

  const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ category });
});

export const DELETE = requireAdmin(async (request, { params }) => {
  await dbConnect();
  const { id } = await params;

  const category = await Category.findById(id);
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productsUsingIt = await Product.countDocuments({ category: category.slug });
  if (productsUsingIt > 0) {
    return NextResponse.json(
      {
        error: `Can't delete "${category.name}" — ${productsUsingIt} product(s) still use it. Reassign or delete those products first.`,
      },
      { status: 409 }
    );
  }

  await Category.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
});