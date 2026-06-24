/**
 * DHL API Integration
 *
 * Uses DHL Parcel DE Shipping API v2 (Post & Parcel Germany)
 * Auth: HTTP Basic Auth (username:password base64-encoded)
 * No OAuth, no token endpoint — Basic Auth on every request.
 *
 * Sandbox base URL: https://api-sandbox.dhl.com/parcel/de/shipping/v2
 * Live base URL:    https://api-eu.dhl.com/parcel/de/shipping/v2
 *
 * API Docs: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2
 */

const DHL_API_BASE_URL =
  process.env.DHL_API_URL || "https://api-sandbox.dhl.com/parcel/de/shipping/v2";
const DHL_TRACKING_URL =
  "https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html";

/**
 * Build the Basic Auth header value from username and password.
 * DHL v2 uses: Authorization: Basic base64(username:password)
 * The API key goes in a separate dhl-api-key header.
 */
function getBasicAuthHeader() {
  const username = process.env.DHL_USERNAME;
  const password = process.env.DHL_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "DHL_USERNAME and DHL_PASSWORD must be set in environment variables."
    );
  }

  const encoded = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Create a DHL shipment and generate a shipping label.
 * @param {Object} order - Order document from MongoDB
 * @param {Object} options - { express: boolean }
 * @returns {Promise<Object>} { trackingNumber, labelUrl, trackingUrl, carrier, carrierResponse }
 */
export async function createDHLShipment(order, options = {}) {
  // Mock mode — no real API call, useful for local dev
  if (process.env.DHL_MOCK_MODE === "true") {
    console.log("🧪 DHL MOCK MODE: Generating mock label for order", order.orderNumber);
    const mockTrackingNumber = `00340434${Math.floor(Math.random() * 1000000000)}`;
    return {
      trackingNumber: mockTrackingNumber,
      labelUrl: `https://example.com/mock-label-${order.orderNumber}.pdf`,
      trackingUrl: generateDHLTrackingUrl(mockTrackingNumber),
      carrier: "dhl",
      carrierResponse: { mock: true },
    };
  }

  const apiKey = process.env.DHL_API_KEY;
  const accountNumber = process.env.DHL_ACCOUNT_NUMBER;

  if (!apiKey || !accountNumber) {
    throw new Error(
      "DHL_API_KEY and DHL_ACCOUNT_NUMBER must be set in environment variables."
    );
  }

  // V01PAK = standard domestic parcel, V53WPAK = international
  const productCode = options.express ? "V53WPAK" : "V01PAK";

  const shipmentData = {
    profile: "STANDARD_GRUPPENPROFIL",
    shipments: [
      {
        product: productCode,
        billingNumber: accountNumber,
        refNo: order.orderNumber,
        shipDate: new Date().toISOString().split("T")[0],

        shipper: {
          name1: process.env.DHL_SHIPPER_NAME || "Your Company Name",
          addressStreet: process.env.DHL_SHIPPER_STREET || "Musterstraße",
          addressHouse: process.env.DHL_SHIPPER_HOUSE_NUMBER || "1",
          postalCode: process.env.DHL_SHIPPER_POSTAL_CODE || "12345",
          city: process.env.DHL_SHIPPER_CITY || "Aachen",
          country: {
            countryISOCode: process.env.DHL_SHIPPER_COUNTRY || "DE",
          },
          email: process.env.DHL_SHIPPER_EMAIL || "shipping@yourcompany.com",
        },

        consignee: {
          name1: order.shippingAddress.name,
          addressStreet: order.shippingAddress.line1,
          addressHouse: order.shippingAddress.line2 || "",
          postalCode: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          country: {
            countryISOCode: order.shippingAddress.country,
          },
          email: order.customerEmail,
        },

        details: {
          weight: {
            uom: "g",
            value: calculateOrderWeight(order),
          },
        },
      },
    ],
  };

  try {
    const response = await fetch(`${DHL_API_BASE_URL}/orders?docFormat=PDF`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": getBasicAuthHeader(),
        "dhl-api-key": apiKey,
      },
      body: JSON.stringify(shipmentData),
    });

    const responseText = await response.text();
    console.log("DHL Shipment Response Status:", response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText };
      }
      console.error("DHL API Error:", JSON.stringify(errorData, null, 2));
      throw new Error(
        `DHL API error: ${response.status} - ${errorData.detail || errorData.title || response.statusText}`
      );
    }

    const data = JSON.parse(responseText);

    if (!data.items || data.items.length === 0) {
      throw new Error("DHL API returned no shipment items.");
    }

    const shipment = data.items[0];

    if (shipment.sstatus?.statusCode && shipment.sstatus.statusCode !== 200) {
      throw new Error(
        `DHL shipment validation failed: ${shipment.sstatus.detail || shipment.sstatus.title}`
      );
    }

    return {
      trackingNumber: shipment.shipmentNo,
      labelUrl: shipment.label?.url || null,
      labelB64: shipment.label?.b64 || null,
      trackingUrl: generateDHLTrackingUrl(shipment.shipmentNo),
      carrier: "dhl",
      carrierResponse: shipment,
    };
  } catch (error) {
    console.error("Failed to create DHL shipment:", error);
    throw error;
  }
}

/**
 * Get tracking information for a DHL shipment.
 * Uses the separate DHL Tracking API (different key).
 */
export async function getDHLTracking(trackingNumber) {
  const apiKey = process.env.DHL_TRACKING_API_KEY || process.env.DHL_API_KEY;

  if (!apiKey) throw new Error("DHL_TRACKING_API_KEY is not set.");

  const response = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
    { headers: { "DHL-API-Key": apiKey } }
  );

  if (!response.ok) {
    throw new Error(`DHL tracking API error: ${response.status}`);
  }

  const data = await response.json();
  return data.shipments?.[0] || null;
}

/**
 * Generate the DHL tracking URL for a given tracking number.
 */
export function generateDHLTrackingUrl(trackingNumber) {
  return `${DHL_TRACKING_URL}?piececode=${trackingNumber}`;
}

/**
 * Validate that credentials are present and the API is reachable.
 * Does a lightweight GET to /orders (no body) just to check auth.
 */
export async function validateDHLCredentials() {
  const apiKey = process.env.DHL_API_KEY;
  if (!apiKey || !process.env.DHL_USERNAME || !process.env.DHL_PASSWORD) return false;

  try {
    const response = await fetch(`${DHL_API_BASE_URL}/orders`, {
      method: "GET",
      headers: {
        "Authorization": getBasicAuthHeader(),
        "dhl-api-key": apiKey,
      },
    });
    // 400 = auth passed but bad request (no params) — fine for a credential check
    // 401 = auth failed
    return response.status !== 401;
  } catch {
    return false;
  }
}

/**
 * Calculate total shipment weight in grams.
 */
function calculateOrderWeight(order) {
  const DEFAULT_ITEM_WEIGHT = 100; // grams per item
  const PACKAGING_WEIGHT = 50;     // grams for box/padding

  let total = PACKAGING_WEIGHT;
  for (const item of order.items) {
    total += (item.weightGrams || DEFAULT_ITEM_WEIGHT) * item.quantity;
  }
  return Math.round(total);
}

// Made with Bob