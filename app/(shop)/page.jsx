import { dbConnect } from "@/lib/db";
import Product from "@/lib/models/Product";
import HomePageClient from "@/components/shop/HomePageClient";

// Revalidate every 60 s so stock/pricing stays fresh without a cold DB hit on every request.
export const revalidate = 60;

export const metadata = {
  title: "Premium Lighters for Everyday Carry",
  description:
    "Shop machined precision lighters, torch lighters and EDC accessories at Spark & Co. Secure checkout with card or Bitcoin.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app",
  },
};

async function getFeatured() {
  await dbConnect();
  const products = await Product.find({ isActive: true })
    .sort({ featured: -1, createdAt: -1 })
    .limit(6)
    .lean();
  return JSON.parse(JSON.stringify(products));
}

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

export default async function HomePage() {
  const products = await getFeatured();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Spark & Co.",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Spark & Co.",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <HomePageClient products={products} />
    </>
  );
}

// Made with Bob
