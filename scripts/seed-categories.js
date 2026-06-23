require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const DEMO_CATEGORIES = [
  { name: "Torch", slug: "torch", sortOrder: 1 },
  { name: "Electric", slug: "electric", sortOrder: 2 },
  { name: "Classic", slug: "classic", sortOrder: 3 },
  { name: "Refillable", slug: "refillable", sortOrder: 4 },
  { name: "Novelty", slug: "novelty", sortOrder: 5 },
  { name: "Accessory", slug: "accessory", sortOrder: 6 },
  { name: "Lighter Fuel", slug: "lighter-fuel", sortOrder: 7 },
];

async function main() {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");

  await mongoose.connect(MONGODB_URI);

  const CategorySchema = new mongoose.Schema(
    {
      name: String,
      slug: { type: String, unique: true },
      description: String,
      sortOrder: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

  for (const c of DEMO_CATEGORIES) {
    const existing = await Category.findOne({ slug: c.slug });
    if (existing) {
      console.log(`Skipping existing category: ${c.name}`);
      continue;
    }
    await Category.create(c);
    console.log(`✅ Created category: ${c.name}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("❌ Failed to seed categories:", err.message);
  process.exit(1);
});