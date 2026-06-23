import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";

export async function GET(request, { params }) {
  await dbConnect();
  const { slug } = await params;

  const product = await Product.findOne({ slug, isActive: true }).select("-__v").lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
