import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import Category from "@/lib/models/Categories";
import ProductsListClient from "@/components/shop/ProductsListClient";

// Revalidate every 60 s — category filters are stable enough for short-lived caching.
export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = params?.category || "";
  const title = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} Lighters`
    : "All Products";
  const description = category
    ? `Browse our range of ${category} lighters and accessories at Spark & Co.`
    : "Browse our full range of precision lighters and EDC accessories at Spark & Co.";
  const url = category
    ? `${SITE_URL}/products?category=${encodeURIComponent(category)}`
    : `${SITE_URL}/products`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { url, title, description },
  };
}

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

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Lighters` : "All Products",
    url: category ? `${SITE_URL}/products?category=${encodeURIComponent(category)}` : `${SITE_URL}/products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <ProductsListClient products={products} categories={categories} currentCategory={category} />
    </>
  );
}

// Made with Bob
