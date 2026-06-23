import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import HomePageClient from "@/components/shop/HomePageClient";

// Always fetch live stock/pricing rather than serving a stale, build-time snapshot.
export const dynamic = "force-dynamic";

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
