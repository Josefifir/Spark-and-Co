import mongoose from "mongoose";

const shippingRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  type: {
    type: String,
    enum: ["flat_rate", "free", "weight_based", "price_based"],
    required: true,
  },
  // For flat_rate
  flatRate: {
    type: Number,
    min: 0,
  },
  // For free shipping threshold
  freeShippingThreshold: {
    type: Number,
    min: 0,
  },
  // For weight-based
  weightRanges: [{
    minWeight: Number, // in grams
    maxWeight: Number,
    rate: Number,
  }],
  // For price-based
  priceRanges: [{
    minPrice: Number, // in cents
    maxPrice: Number,
    rate: Number,
  }],
  // Delivery estimates
  estimatedMinDays: {
    type: Number,
    min: 0,
  },
  estimatedMaxDays: {
    type: Number,
    min: 0,
  },
  // Carrier information
  carrier: {
    type: String,
    enum: ["dhl", "dpd", "ups", "fedex", "usps", "royal_mail", "other"],
  },
  carrierService: String, // e.g., "DHL Express", "DPD Classic"
  enabled: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0, // Higher priority shown first
  },
});

const shippingZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  countries: [{
    type: String, // ISO 3166-1 alpha-2 country codes
    required: true,
  }],
  regions: [{
    country: String,
    states: [String], // State/province codes
  }],
  postalCodes: [{
    country: String,
    patterns: [String], // Regex patterns for postal codes
  }],
  rates: [shippingRateSchema],
  enabled: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0, // Higher priority zones checked first
  },
}, {
  timestamps: true,
});

// Index for faster lookups
shippingZoneSchema.index({ countries: 1, enabled: 1 });
shippingZoneSchema.index({ priority: -1 });

// Method to check if address matches this zone
shippingZoneSchema.methods.matchesAddress = function(address) {
  // Check country
  if (!this.countries.includes(address.country)) {
    return false;
  }

  // Check regions if specified
  if (this.regions && this.regions.length > 0) {
    const regionMatch = this.regions.find(r => 
      r.country === address.country && 
      (!r.states || r.states.length === 0 || r.states.includes(address.state))
    );
    if (!regionMatch) {
      return false;
    }
  }

  // Check postal codes if specified
  if (this.postalCodes && this.postalCodes.length > 0) {
    const postalMatch = this.postalCodes.find(pc => {
      if (pc.country !== address.country) return false;
      if (!pc.patterns || pc.patterns.length === 0) return true;
      return pc.patterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(address.postalCode);
      });
    });
    if (!postalMatch) {
      return false;
    }
  }

  return true;
};

// Method to calculate shipping rate for an order
shippingZoneSchema.methods.calculateRate = function(orderDetails) {
  const { subtotalCents, weightGrams, items } = orderDetails;
  const availableRates = this.rates.filter(r => r.enabled);

  return availableRates.map(rate => {
    let shippingCost = 0;
    let isFree = false;

    switch (rate.type) {
      case "flat_rate":
        shippingCost = rate.flatRate || 0;
        break;

      case "free":
        if (rate.freeShippingThreshold && subtotalCents >= rate.freeShippingThreshold) {
          shippingCost = 0;
          isFree = true;
        } else {
          return null; // Threshold not met
        }
        break;

      case "weight_based":
        if (rate.weightRanges && weightGrams) {
          const range = rate.weightRanges.find(r => 
            weightGrams >= (r.minWeight || 0) && 
            weightGrams <= (r.maxWeight || Infinity)
          );
          if (range) {
            shippingCost = range.rate;
          } else {
            return null; // No matching weight range
          }
        }
        break;

      case "price_based":
        if (rate.priceRanges) {
          const range = rate.priceRanges.find(r => 
            subtotalCents >= (r.minPrice || 0) && 
            subtotalCents <= (r.maxPrice || Infinity)
          );
          if (range) {
            shippingCost = range.rate;
          } else {
            return null; // No matching price range
          }
        }
        break;
    }

    return {
      id: rate._id,
      name: rate.name,
      description: rate.description,
      cost: shippingCost,
      isFree,
      estimatedMinDays: rate.estimatedMinDays,
      estimatedMaxDays: rate.estimatedMaxDays,
      carrier: rate.carrier,
      carrierService: rate.carrierService,
    };
  }).filter(Boolean); // Remove null entries
};

const ShippingZone = mongoose.models.ShippingZone || mongoose.model("ShippingZone", shippingZoneSchema);

export default ShippingZone;

// Made with Bob