/**
 * Seeds demo products. Run with: node scripts/seed-products.js
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const DEMO_PRODUCTS = [
  {
    name: "Ridgeline Torch",
    slug: "ridgeline-torch",
    description:
      "Single-jet torch lighter machined from aircraft-grade aluminum. Windproof flame rated for outdoor use. Adjustable flame height with a locking flame guard.",
    priceCents: 4200,
    category: "torch",
    stock: 24,
    sku: "STR-TRC-001",
    images: [],
    featured: true,
  },
  {
    name: "Forge Refillable Classic",
    slug: "forge-refillable-classic",
    description:
      "Brass-bodied refillable lighter with a flint-wheel ignition. Holds 8mL of fuel, good for roughly 3 weeks of daily use. Brushed steel finish.",
    priceCents: 3500,
    category: "refillable",
    stock: 40,
    sku: "STR-CLS-002",
    images: [],
    featured: true,
  },
  {
    name: "Voltaic Arc Electric",
    slug: "voltaic-arc-electric",
    description:
      "Flameless dual-arc plasma lighter. USB-C rechargeable, 300+ ignitions per charge. Windproof and flameless — built for the outdoors.",
    priceCents: 5800,
    category: "electric",
    stock: 15,
    sku: "STR-ELC-003",
    images: [],
    featured: true,
  },
  {
    name: "Lowlight Pocket Torch",
    slug: "lowlight-pocket-torch",
    description:
      "Compact single-jet torch sized for a coin pocket. Soft-touch matte body with a visible fuel window.",
    priceCents: 2800,
    category: "torch",
    stock: 60,
    sku: "STR-TRC-004",
  },
  {
    name: "Heritage Brass Refillable",
    slug: "heritage-brass-refillable",
    description:
      "Solid brass construction with a hinged cap. A modern take on a century-old design, hand-assembled and individually tested.",
    priceCents: 6500,
    category: "refillable",
    stock: 8,
    sku: "STR-CLS-005",
  },
  {
    name: "Driftwood Matte Classic",
    slug: "driftwood-matte-classic",
    description:
      "Lightweight everyday lighter with a soft-touch matte shell. Reliable flint ignition, replaceable flint and fuel.",
    priceCents: 1800,
    category: "classic",
    stock: 100,
    sku: "STR-CLS-006",
  },
];

async function main() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");

  await mongoose.connect(MONGODB_URI);

  const ProductSchema = new mongoose.Schema(
    {
      name: String,
      slug: { type: String, unique: true },
      description: String,
      priceCents: Number,
      currency: { type: String, default: "usd" },
      images: [String],
      category: String,
      stock: Number,
      sku: { type: String, unique: true },
      isActive: { type: Boolean, default: true },
      featured: { type: Boolean, default: false },
      ageRestricted: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

  for (const p of DEMO_PRODUCTS) {
    const existing = await Product.findOne({ sku: p.sku });
    if (existing) {
      console.log(`Skipping existing product: ${p.name}`);
      continue;
    }
    await Product.create(p);
    console.log(`✅ Created: ${p.name}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("❌ Failed to seed products:", err.message);
  process.exit(1);
});
