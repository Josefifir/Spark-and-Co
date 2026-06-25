/**
 * DHL Parcel DE Shipping API v2 Integration (Post & Parcel Germany)
 *
 * Official Docs: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2
 * Authentication: OAuth2 (recommended) + dhl-api-key header
 */

import cache, { CacheKeys, CacheTTL } from '@/lib/cache';

const DHL_API_BASE_URL =
  process.env.DHL_API_URL || 'https://api-sandbox.dhl.com/parcel/de/shipping/v2';

const AUTH_TOKEN_URL = 'https://api-sandbox.dhl.com/parcel/de/account/auth/ropc/v1/token';
// For production change to: 'https://api-eu.dhl.com/parcel/de/account/auth/ropc/v1/token'

const DHL_TRACKING_BASE = 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html';

/**
 * Get OAuth2 Bearer Token (with Redis caching)
 */
async function getDHLToken() {
  const cacheKey = CacheKeys.dhlToken();
  
  // Try to get from cache
  const cachedToken = await cache.get(cacheKey);
  if (cachedToken) return cachedToken;

  const username = process.env.DHL_USERNAME;
  const password = process.env.DHL_PASSWORD;
  const apiKey = process.env.DHL_API_KEY;
  const apiSecret = process.env.DHL_API_SECRET;

  if (!username || !password || !apiKey || !apiSecret) {
    throw new Error('Missing DHL credentials (DHL_USERNAME, DHL_PASSWORD, DHL_API_KEY, DHL_API_SECRET)');
  }

  const response = await fetch(AUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`DHL Auth failed: ${data.error_description || data.error || response.statusText}`);
  }

  const token = data.access_token;
  
  // Cache for 25 minutes (tokens typically valid for 30 minutes)
  await cache.set(cacheKey, token, 1500);
  
  return token;
}

/**
 * Create a DHL shipment and generate shipping label
 * @param {Object} order - Order object from your database
 * @param {Object} options - { express?: boolean }
 */
async function createDHLShipment(order, options = {}) {
  // Mock mode for local development
  if (process.env.DHL_MOCK_MODE === 'true') {
    console.log('🧪 DHL MOCK MODE: Generating mock label for order', order.orderNumber);
    const mockTrackingNumber = `00340434${Math.floor(Math.random() * 1000000000)}`;
    return {
      trackingNumber: mockTrackingNumber,
      labelUrl: `https://example.com/mock-label-${order.orderNumber}.pdf`,
      labelB64: null,
      trackingUrl: generateDHLTrackingUrl(mockTrackingNumber),
      carrier: 'dhl',
      carrierResponse: { mock: true },
    };
  }

  const token = await getDHLToken();
  const apiKey = process.env.DHL_API_KEY;
  const billingNumber = process.env.DHL_BILLING_NUMBER; // Full 14-digit billing number recommended

  if (!billingNumber) {
    throw new Error('DHL_BILLING_NUMBER environment variable is required');
  }

  const productCode = options.express ? 'V53WPAK' : 'V01PAK';

  const shipmentData = {
    profile: process.env.DHL_PROFILE || 'STANDARD_GRUPPENPROFIL',
    shipments: [
      {
        product: productCode,
        billingNumber,
        refNo: order.orderNumber,
        shipDate: new Date().toISOString().split('T')[0],
        shipper: {
          name1: process.env.DHL_SHIPPER_NAME || 'Your Company',
          addressStreet: process.env.DHL_SHIPPER_STREET || 'Musterstraße',
          addressHouse: process.env.DHL_SHIPPER_HOUSE_NUMBER || '1',
          postalCode: process.env.DHL_SHIPPER_POSTAL_CODE || '12345',
          city: process.env.DHL_SHIPPER_CITY || 'Aachen',
          country: { countryISOCode: process.env.DHL_SHIPPER_COUNTRY || 'DE' },
          email: process.env.DHL_SHIPPER_EMAIL,
        },
        consignee: {
          name1: order.shippingAddress?.name || order.customerName,
          addressStreet: order.shippingAddress?.line1,
          addressHouse: order.shippingAddress?.line2 || '',
          postalCode: order.shippingAddress?.postalCode,
          city: order.shippingAddress?.city,
          country: { countryISOCode: order.shippingAddress?.country || 'DE' },
          email: order.customerEmail,
        },
        details: {
          weight: {
            uom: 'g',
            value: calculateOrderWeight(order),
          },
          // Add more fields here when needed: dimensions, services, notification, customs, etc.
        },
      },
    ],
  };

  try {
    const url = `${DHL_API_BASE_URL}/orders?validate=true&docFormat=PDF`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'dhl-api-key': apiKey,
      },
      body: JSON.stringify(shipmentData),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText };
      }
      console.error('DHL API Error:', errorData);
      throw new Error(
        `DHL API error (${response.status}): ${errorData.title || errorData.detail || response.statusText}`
      );
    }

    const data = JSON.parse(responseText);
    const shipment = Array.isArray(data.items) ? data.items[0] : data;

    if (shipment.sstatus?.statusCode && shipment.sstatus.statusCode !== 200) {
      throw new Error(`DHL validation failed: ${shipment.sstatus.detail || shipment.sstatus.title}`);
    }

    return {
      trackingNumber: shipment.shipmentNo,
      labelUrl: shipment.label?.url || null,
      labelB64: shipment.label?.b64 || null,
      trackingUrl: generateDHLTrackingUrl(shipment.shipmentNo),
      carrier: 'dhl',
      carrierResponse: shipment,
    };
  } catch (error) {
    console.error('Failed to create DHL shipment:', error);
    throw error;
  }
}

/**
 * Get tracking information
 */
async function getDHLTracking(trackingNumber) {
  const apiKey = process.env.DHL_TRACKING_API_KEY || process.env.DHL_API_KEY;
  if (!apiKey) throw new Error('DHL_TRACKING_API_KEY is required');

  const response = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
    {
      headers: { 'DHL-API-Key': apiKey },
    }
  );

  if (!response.ok) {
    throw new Error(`Tracking API error: ${response.status}`);
  }

  const data = await response.json();
  return data.shipments?.[0] || null;
}

/**
 * Generate DHL tracking URL
 */
function generateDHLTrackingUrl(trackingNumber) {
  return `${DHL_TRACKING_BASE}?piececode=${trackingNumber}`;
}

/**
 * Lightweight credential validation
 */
async function validateDHLCredentials() {
  try {
    const token = await getDHLToken();
    const apiKey = process.env.DHL_API_KEY;

    const response = await fetch(`${DHL_API_BASE_URL}/orders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'dhl-api-key': apiKey,
      },
    });

    return response.status !== 401;
  } catch {
    return false;
  }
}

/**
 * Calculate total weight in grams
 */
function calculateOrderWeight(order) {
  const DEFAULT_ITEM_WEIGHT = 100; // grams per item
  const PACKAGING_WEIGHT = 50;
  let total = PACKAGING_WEIGHT;

  for (const item of order.items || []) {
    total += (item.weightGrams || DEFAULT_ITEM_WEIGHT) * (item.quantity || 1);
  }
  return Math.round(total);
}

export {
  createDHLShipment,
  getDHLTracking,
  generateDHLTrackingUrl,
  validateDHLCredentials,
};