require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const path = require("path");

// Import the actual ShippingZone model
const ShippingZone = require(path.join(__dirname, "..", "lib", "models", "ShippingZone.js")).default;

const defaultZones = [
  {
    name: "Germany",
    description: "Domestic shipping within Germany",
    countries: ["DE"],
    rates: [
      {
        name: "DHL Standard",
        description: "Standard delivery",
        type: "flat_rate",
        flatRate: 499, // €4.99 in cents
        estimatedMinDays: 1,
        estimatedMaxDays: 3,
        carrier: "dhl",
        carrierService: "DHL Paket",
        enabled: true,
        priority: 1,
      },
      {
        name: "DHL Express",
        description: "Next business day delivery",
        type: "flat_rate",
        flatRate: 999, // €9.99
        estimatedMinDays: 1,
        estimatedMaxDays: 1,
        carrier: "dhl",
        carrierService: "DHL Express",
        enabled: true,
        priority: 2,
      },
      {
        name: "Free Shipping",
        description: "Free shipping on orders over €50",
        type: "free",
        freeShippingThreshold: 5000, // €50 in cents
        estimatedMinDays: 2,
        estimatedMaxDays: 4,
        carrier: "dhl",
        carrierService: "DHL Paket",
        enabled: true,
        priority: 3,
      },
    ],
    enabled: true,
    priority: 100,
  },
  {
    name: "European Union",
    description: "Shipping to EU countries",
    countries: [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
      "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL",
      "PT", "RO", "SK", "SI", "ES", "SE"
    ],
    rates: [
      {
        name: "DPD Standard",
        description: "Standard EU delivery",
        type: "flat_rate",
        flatRate: 1299, // €12.99
        estimatedMinDays: 3,
        estimatedMaxDays: 7,
        carrier: "dpd",
        carrierService: "DPD Classic",
        enabled: true,
        priority: 1,
      },
      {
        name: "DHL Express EU",
        description: "Express delivery to EU",
        type: "flat_rate",
        flatRate: 1999, // €19.99
        estimatedMinDays: 2,
        estimatedMaxDays: 4,
        carrier: "dhl",
        carrierService: "DHL Express",
        enabled: true,
        priority: 2,
      },
      {
        name: "Free Shipping EU",
        description: "Free shipping on orders over €100",
        type: "free",
        freeShippingThreshold: 10000, // €100
        estimatedMinDays: 4,
        estimatedMaxDays: 8,
        carrier: "dpd",
        carrierService: "DPD Classic",
        enabled: true,
        priority: 3,
      },
    ],
    enabled: true,
    priority: 90,
  },
  {
    name: "United Kingdom",
    description: "Shipping to UK",
    countries: ["GB"],
    rates: [
      {
        name: "Royal Mail Standard",
        description: "Standard delivery to UK",
        type: "flat_rate",
        flatRate: 1499, // €14.99
        estimatedMinDays: 5,
        estimatedMaxDays: 10,
        carrier: "royal_mail",
        carrierService: "Royal Mail International Standard",
        enabled: true,
        priority: 1,
      },
      {
        name: "DHL Express UK",
        description: "Express delivery to UK",
        type: "flat_rate",
        flatRate: 2499, // €24.99
        estimatedMinDays: 2,
        estimatedMaxDays: 4,
        carrier: "dhl",
        carrierService: "DHL Express",
        enabled: true,
        priority: 2,
      },
    ],
    enabled: true,
    priority: 80,
  },
  {
    name: "United States",
    description: "Shipping to USA",
    countries: ["US"],
    rates: [
      {
        name: "USPS Priority",
        description: "Priority mail to USA",
        type: "flat_rate",
        flatRate: 2999, // €29.99
        estimatedMinDays: 7,
        estimatedMaxDays: 14,
        carrier: "usps",
        carrierService: "USPS Priority Mail International",
        enabled: true,
        priority: 1,
      },
      {
        name: "DHL Express USA",
        description: "Express delivery to USA",
        type: "flat_rate",
        flatRate: 4999, // €49.99
        estimatedMinDays: 3,
        estimatedMaxDays: 5,
        carrier: "dhl",
        carrierService: "DHL Express Worldwide",
        enabled: true,
        priority: 2,
      },
    ],
    enabled: true,
    priority: 70,
  },
  {
    name: "Rest of World",
    description: "International shipping to other countries",
    countries: [
      "CA", "AU", "NZ", "JP", "KR", "SG", "HK", "TW", "IN", "BR",
      "MX", "AR", "CL", "ZA", "AE", "SA", "IL", "TR", "RU", "UA",
      "NO", "CH", "IS"
    ],
    rates: [
      {
        name: "International Standard",
        description: "Standard international delivery",
        type: "flat_rate",
        flatRate: 3499, // €34.99
        estimatedMinDays: 10,
        estimatedMaxDays: 21,
        carrier: "dhl",
        carrierService: "DHL Paket International",
        enabled: true,
        priority: 1,
      },
      {
        name: "DHL Express International",
        description: "Express international delivery",
        type: "flat_rate",
        flatRate: 5999, // €59.99
        estimatedMinDays: 4,
        estimatedMaxDays: 7,
        carrier: "dhl",
        carrierService: "DHL Express Worldwide",
        enabled: true,
        priority: 2,
      },
    ],
    enabled: true,
    priority: 60,
  },
];

async function seedShippingZones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing zones
    await ShippingZone.deleteMany({});
    console.log("Cleared existing shipping zones");

    // Insert default zones
    await ShippingZone.insertMany(defaultZones);
    console.log(`✅ Created ${defaultZones.length} shipping zones`);

    // Display summary
    for (const zone of defaultZones) {
      console.log(`\n📦 ${zone.name}`);
      console.log(`   Countries: ${zone.countries.length}`);
      console.log(`   Rates: ${zone.rates.length}`);
      zone.rates.forEach(rate => {
        const cost = rate.flatRate ? `€${(rate.flatRate / 100).toFixed(2)}` : 
                     rate.freeShippingThreshold ? `Free over €${(rate.freeShippingThreshold / 100).toFixed(2)}` : 
                     'Variable';
        console.log(`   - ${rate.name}: ${cost} (${rate.estimatedMinDays}-${rate.estimatedMaxDays} days)`);
      });
    }

    console.log("\n✅ Shipping zones seeded successfully!");
  } catch (error) {
    console.error("Error seeding shipping zones:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedShippingZones();

// Made with Bob