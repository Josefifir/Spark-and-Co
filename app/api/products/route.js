import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const products = await Product.find(filter)
    .select("-__v")
    .sort({ featured: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ products });
}
