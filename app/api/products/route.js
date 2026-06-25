import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";

export async function GET(request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);
  
  // Validate pagination params
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 per page
  const skip = (validPage - 1) * validLimit;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("-__v")
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(validLimit)
      .lean(),
    Product.countDocuments(filter)
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page: validPage,
      limit: validLimit,
      total,
      pages: Math.ceil(total / validLimit),
      hasMore: skip + products.length < total
    }
  });
}
