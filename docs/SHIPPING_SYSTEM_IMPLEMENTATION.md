# Shipping System Implementation Guide

## Overview

This document describes the complete shipping zones and rates system, including integration with the checkout process, delivery estimates, and carrier API integration.

## System Components

### 1. Database Model

**File**: `lib/models/ShippingZone.js`

The ShippingZone model supports:
- Multiple rate types (flat_rate, free, weight_based, price_based)
- Geographic targeting (countries, regions, postal codes)
- Delivery time estimates
- Carrier information (DHL, DPD, UPS, FedEx, USPS, Royal Mail)
- Priority-based matching

### 2. API Endpoints

#### Admin Endpoints
- `POST /api/admin/shipping-zones` - Create shipping zone
- `GET /api/admin/shipping-zones` - List all zones
- `GET /api/admin/shipping-zones/[id]` - Get single zone
- `PATCH /api/admin/shipping-zones/[id]` - Update zone
- `DELETE /api/admin/shipping-zones/[id]` - Delete zone

#### Public Endpoint
- `POST /api/shipping/calculate` - Calculate shipping rates for address

**Request Body**:
```json
{
  "address": {
    "country": "DE",
    "state": "NRW",
    "postalCode": "52074",
    "city": "Aachen"
  },
  "orderDetails": {
    "subtotalCents": 5500,
    "weightGrams": 250,
    "items": [...]
  }
}
```

**Response**:
```json
{
  "rates": [
    {
      "id": "rate_id",
      "name": "DHL Standard",
      "description": "Standard delivery",
      "cost": 499,
      "isFree": false,
      "estimatedMinDays": 1,
      "estimatedMaxDays": 3,
      "carrier": "dhl",
      "carrierService": "DHL Paket",
      "zoneName": "Germany",
      "zoneId": "zone_id"
    }
  ]
}
```

### 3. Order Model Updates

**File**: `lib/models/Order.js`

Added fields:
```javascript
{
  shippingCents: Number,
  shippingMethod: {
    name: String,
    carrier: String,
    carrierService: String,
    estimatedMinDays: Number,
    estimatedMaxDays: Number,
    cost: Number,
  },
  trackingNumber: String,
  trackingUrl: String,
  shippingLabelUrl: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
}
```

## Checkout Integration

### Step 1: Add State for Shipping

Add to checkout page state:
```javascript
const [shippingRates, setShippingRates] = useState([]);
const [selectedShipping, setSelectedShipping] = useState(null);
const [loadingShipping, setLoadingShipping] = useState(false);
```

### Step 2: Calculate Shipping When Address Changes

```javascript
useEffect(() => {
  if (form.country && form.city && form.postalCode) {
    calculateShipping();
  }
}, [form.country, form.city, form.postalCode, subtotalCents]);

async function calculateShipping() {
  setLoadingShipping(true);
  try {
    const res = await fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: {
          country: form.country,
          state: form.state,
          postalCode: form.postalCode,
          city: form.city,
        },
        orderDetails: {
          subtotalCents: appliedDiscount 
            ? subtotalCents - appliedDiscount.discountCents 
            : subtotalCents,
          weightGrams: items.reduce((sum, item) => sum + (item.weightGrams || 100) * item.quantity, 0),
          items,
        },
      }),
    });

    const data = await res.json();
    setShippingRates(data.rates || []);
    
    // Auto-select first (cheapest/free) rate
    if (data.rates && data.rates.length > 0) {
      setSelectedShipping(data.rates[0]);
    }
  } catch (error) {
    console.error("Failed to calculate shipping:", error);
    toast.error("Failed to calculate shipping rates");
  } finally {
    setLoadingShipping(false);
  }
}
```

### Step 3: Add Shipping Selection UI

Add after the address form section:
```jsx
{shippingRates.length > 0 && (
  <section>
    <h2 className="font-mono-tech text-xs uppercase tracking-wider text-steel mb-4">
      Shipping Method
    </h2>
    <div className="space-y-3">
      {shippingRates.map((rate) => (
        <button
          key={rate.id}
          type="button"
          onClick={() => setSelectedShipping(rate)}
          className={`w-full text-left p-4 rounded-md border transition-colors ${
            selectedShipping?.id === rate.id
              ? "border-flame bg-flame/5"
              : "border-hairline hover:border-steel"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-paper">{rate.name}</p>
              {rate.description && (
                <p className="text-sm text-paper-dim mt-1">{rate.description}</p>
              )}
              {rate.estimatedMinDays && rate.estimatedMaxDays && (
                <p className="text-xs text-steel mt-1">
                  Estimated delivery: {rate.estimatedMinDays === rate.estimatedMaxDays 
                    ? `${rate.estimatedMinDays} business day${rate.estimatedMinDays > 1 ? 's' : ''}`
                    : `${rate.estimatedMinDays}-${rate.estimatedMaxDays} business days`}
                </p>
              )}
            </div>
            <div className="text-right">
              {rate.isFree ? (
                <span className="text-flame font-medium">FREE</span>
              ) : (
                <span className="font-mono-tech text-paper">
                  {formatPrice(rate.cost)}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  </section>
)}
```

### Step 4: Update Order Summary

Update the total calculation:
```javascript
const shippingCost = selectedShipping?.cost || 0;
const finalTotal = finalSubtotal + shippingCost;
```

Add shipping line to order summary:
```jsx
{selectedShipping && (
  <div className="flex justify-between text-sm">
    <span className="text-paper-dim">
      Shipping ({selectedShipping.name})
    </span>
    <span className="font-mono-tech text-paper">
      {selectedShipping.isFree ? (
        <span className="text-flame">FREE</span>
      ) : (
        formatPrice(selectedShipping.cost)
      )}
    </span>
  </div>
)}
```

### Step 5: Update Checkout API

**File**: `app/api/checkout/route.js`

Add shipping to order creation:
```javascript
const order = await Order.create({
  // ... existing fields
  shippingCents: selectedShipping?.cost || 0,
  shippingMethod: selectedShipping ? {
    name: selectedShipping.name,
    carrier: selectedShipping.carrier,
    carrierService: selectedShipping.carrierService,
    estimatedMinDays: selectedShipping.estimatedMinDays,
    estimatedMaxDays: selectedShipping.estimatedMaxDays,
    cost: selectedShipping.cost,
  } : null,
  totalCents: finalSubtotal + (selectedShipping?.cost || 0),
  // Calculate estimated delivery date
  estimatedDeliveryDate: selectedShipping?.estimatedMaxDays 
    ? new Date(Date.now() + selectedShipping.estimatedMaxDays * 24 * 60 * 60 * 1000)
    : null,
});
```

## Product Page Integration

### Add Delivery Estimate

**File**: `app/(shop)/products/[slug]/page.jsx`

Add after price:
```jsx
<div className="flex items-center gap-2 text-sm text-steel mt-2">
  <Truck className="w-4 h-4" />
  <span>Ships in 1-3 business days</span>
</div>
```

For dynamic estimates based on customer location:
```jsx
{estimatedDelivery && (
  <div className="flex items-center gap-2 text-sm text-steel mt-2">
    <Truck className="w-4 h-4" />
    <span>
      Estimated delivery: {estimatedDelivery.minDays === estimatedDelivery.maxDays
        ? `${estimatedDelivery.minDays} business day${estimatedDelivery.minDays > 1 ? 's' : ''}`
        : `${estimatedDelivery.minDays}-${estimatedDelivery.maxDays} business days`}
    </span>
  </div>
)}
```

## Admin Shipping Management UI

### Create Admin Page

**File**: `app/admin/shipping/page.jsx`

```jsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function AdminShippingPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZones();
  }, []);

  async function fetchZones() {
    try {
      const res = await fetch("/api/admin/shipping-zones");
      const data = await res.json();
      setZones(data.zones);
    } catch (error) {
      console.error("Failed to fetch zones:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-paper">Shipping Zones</h1>
        <button className="px-4 py-2 bg-flame text-graphite rounded-md hover:bg-flame-bright">
          <Plus className="w-4 h-4 inline mr-2" />
          Add Zone
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => (
            <div key={zone._id} className="bg-panel border border-hairline rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-paper">{zone.name}</h3>
                  <p className="text-sm text-paper-dim">{zone.description}</p>
                  <p className="text-xs text-steel mt-1">
                    {zone.countries.length} countries
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-paper-dim hover:text-paper">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-danger hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-paper-dim">Shipping Rates:</h4>
                {zone.rates.map((rate, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-panel-raised rounded">
                    <div>
                      <p className="text-sm font-medium text-paper">{rate.name}</p>
                      <p className="text-xs text-steel">
                        {rate.carrier} - {rate.estimatedMinDays}-{rate.estimatedMaxDays} days
                      </p>
                    </div>
                    <div className="text-right">
                      {rate.type === "free" ? (
                        <span className="text-flame font-medium">FREE</span>
                      ) : (
                        <span className="font-mono-tech text-paper">
                          €{(rate.flatRate / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Carrier API Integration

### DHL Integration

**File**: `lib/carriers/dhl.js`

```javascript
export async function createDHLShipment(order) {
  const apiKey = process.env.DHL_API_KEY;
  const apiSecret = process.env.DHL_API_SECRET;
  
  const shipment = {
    shipmentDetails: {
      product: "V01PAK", // DHL Paket
      accountNumber: process.env.DHL_ACCOUNT_NUMBER,
      shipmentDate: new Date().toISOString().split('T')[0],
      service: {
        product: "V01PAK",
      },
    },
    shipper: {
      name: "Your Company Name",
      addressStreet: "Your Street",
      addressHouse: "123",
      postalCode: "12345",
      city: "Your City",
      country: "DE",
    },
    consignee: {
      name: order.shippingAddress.name,
      addressStreet: order.shippingAddress.line1,
      postalCode: order.shippingAddress.postalCode,
      city: order.shippingAddress.city,
      country: order.shippingAddress.country,
    },
  };

  const response = await fetch("https://api-sandbox.dhl.com/parcel/de/shipping/v2/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
    },
    body: JSON.stringify(shipment),
  });

  const data = await response.json();
  
  return {
    trackingNumber: data.items[0].shipmentNo,
    labelUrl: data.items[0].label.url,
    trackingUrl: `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${data.items[0].shipmentNo}`,
  };
}
```

### Admin Order Page Integration

**File**: `app/admin/orders/[id]/page.jsx`

Add button to generate shipping label:
```jsx
{order.paymentStatus === "paid" && !order.trackingNumber && (
  <button
    onClick={handleGenerateLabel}
    className="px-4 py-2 bg-flame text-graphite rounded-md hover:bg-flame-bright"
  >
    Generate Shipping Label
  </button>
)}

{order.trackingNumber && (
  <div className="mt-4 p-4 bg-panel-raised rounded-lg">
    <p className="text-sm text-paper-dim">Tracking Number:</p>
    <p className="font-mono-tech text-paper">{order.trackingNumber}</p>
    {order.trackingUrl && (
      <a
        href={order.trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-flame hover:text-flame-bright text-sm mt-2 inline-block"
      >
        Track Shipment →
      </a>
    )}
    {order.shippingLabelUrl && (
      <a
        href={order.shippingLabelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-flame hover:text-flame-bright text-sm mt-2 inline-block ml-4"
      >
        Download Label →
      </a>
    )}
  </div>
)}
```

## Environment Variables

Add to `.env.local`:
```env
# DHL API (Sandbox)
DHL_API_KEY=your_dhl_api_key
DHL_API_SECRET=your_dhl_api_secret
DHL_ACCOUNT_NUMBER=your_account_number

# DPD API
DPD_DELIS_ID=your_dpd_id
DPD_PASSWORD=your_dpd_password

# Production URLs
DHL_API_URL=https://api-eu.dhl.com/parcel/de/shipping/v2
DPD_API_URL=https://public-dis.dpd.nl/services
```

## Seed Default Zones

Run the seed script:
```bash
npm run seed:shipping
```

This creates default zones for:
- Germany (DHL Standard, DHL Express, Free over €50)
- EU Countries (DPD Standard, DHL Express, Free over €100)
- United Kingdom (Royal Mail, DHL Express)
- United States (USPS Priority, DHL Express)
- Rest of World (International Standard, DHL Express)

## Testing

### Test Shipping Calculation

```bash
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "country": "DE",
      "city": "Aachen",
      "postalCode": "52074"
    },
    "orderDetails": {
      "subtotalCents": 5500
    }
  }'
```

### Test Scenarios

1. **Free Shipping Threshold**: Order €50+ to Germany should show free shipping
2. **Multiple Rates**: Should show both standard and express options
3. **International**: Test with US address to see international rates
4. **No Shipping Available**: Test with unsupported country

## Future Enhancements

1. **Real-time Rates**: Integrate with carrier APIs for live rate quotes
2. **Weight-based Rates**: Add product weights and calculate based on total weight
3. **Dimensional Weight**: Calculate based on package dimensions
4. **Multi-package**: Split large orders into multiple packages
5. **Pickup Points**: Integrate DHL Packstation and DPD Pickup locations
6. **Returns Management**: Generate return labels
7. **Customs Forms**: Auto-generate for international shipments

## Made with Bob 🔥