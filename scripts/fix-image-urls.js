/**
 * Script to fix image URLs in the database
 * Replaces localhost URLs with production domain
 * 
 * Usage: node scripts/fix-image-urls.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const PRODUCTION_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://spark-and-co.vercel.app';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function fixImageUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      images: [String],
    }, { strict: false }));

    // Find all products with absolute image URLs (localhost or any origin)
    const products = await Product.find({
      images: { $regex: '^http' }
    });

    console.log(`\n📦 Found ${products.length} products with absolute image URLs`);

    if (products.length === 0) {
      console.log('✅ No products need updating!');
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;

    for (const product of products) {
      const oldImages = [...product.images];
      const newImages = product.images.map(url => {
        // Strip any absolute origin (localhost or any host) and keep only the path
        try {
          const parsed = new URL(url);
          return parsed.pathname; // e.g. /uploads/products/abc.webp
        } catch {
          return url; // already relative — leave it
        }
      });

      // Only update if images changed
      if (JSON.stringify(oldImages) !== JSON.stringify(newImages)) {
        product.images = newImages;
        await product.save();
        updatedCount++;
        
        console.log(`\n✏️  Updated: ${product.name}`);
        console.log(`   Old: ${oldImages[0]}`);
        console.log(`   New: ${newImages[0]}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} products (URLs are now relative paths).`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
fixImageUrls();

// Made with Bob
