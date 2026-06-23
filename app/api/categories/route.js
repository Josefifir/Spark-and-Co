import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Category from "@/lib/models/Categories";

export async function GET() {
  await dbConnect();

  const categories = await Category.find({ isActive: true })
    .select("-__v")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return NextResponse.json({ categories });
}