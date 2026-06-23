import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Categories";
import ProductsListClient from "@/components/shop/ProductsListClient";

export const dynamic = "force-dynamic";

async function getProducts(category) {
  await dbConnect();
  const filter = { isActive: true };
  if (category) filter.category = category;
  const products = await Product.find(filter).sort({ featured: -1, createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(products));
}

async function getCategories() {
  await dbConnect();
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return JSON.parse(JSON.stringify(categories));
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || "";
  const [products, categories] = await Promise.all([getProducts(category), getCategories()]);

  return <ProductsListClient products={products} categories={categories} currentCategory={category} />;
}

// Made with Bob
