import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import HomePageClient from "@/components/shop/HomePageClient";

// Revalidate every 60 s so stock/pricing stays fresh without a cold DB hit on every request.
export const revalidate = 60;

async function getFeatured() {
  await dbConnect();
  const products = await Product.find({ isActive: true })
    .sort({ featured: -1, createdAt: -1 })
    .limit(6)
    .lean();
  return JSON.parse(JSON.stringify(products));
}

export default async function HomePage() {
  const products = await getFeatured();
  return <HomePageClient products={products} />;
}

// Made with Bob
