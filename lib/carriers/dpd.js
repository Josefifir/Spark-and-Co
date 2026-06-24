/**
 * DPD API Integration
 * 
 * This module provides integration with DPD's shipping API for:
 * - Creating shipment labels
 * - Tracking shipments
 * - Generating tracking URLs
 * 
 * API Documentation: https://esolutions.dpd.com/dokumente/
 */

const DPD_API_BASE_URL = process.env.DPD_API_URL || "https://public-dis.dpd.nl/services";
const DPD_TRACKING_URL = "https://tracking.dpd.de/parcelstatus";

/**
 * Create a DPD shipment and generate shipping label
 * @param {Object} order - Order object with shipping details
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Shipment details with tracking number and label URL
 */
export async function createDPDShipment(order, options = {}) {
  const delisId = process.env.DPD_DELIS_ID;
  const password = process.env.DPD_PASSWORD;
  const depotNumber = process.env.DPD_DEPOT_NUMBER;

  if (!delisId || !password || !depotNumber) {
    throw new Error("DPD API credentials not configured. Please set DPD_DELIS_ID, DPD_PASSWORD, and DPD_DEPOT_NUMBER in environment variables.");
  }

  // DPD uses SOAP API, we'll create the XML request
  const shipmentData = {
    delisId,
    password,
    shipment: {
      generalShipmentData: {
        sendingDepot: depotNumber,
        product: options.express ? "CL" : "101", // CL = Classic, 101 = Express
        sender: {
          name1: process.env.DPD_SENDER_NAME || "Your Company Name",
          street: process.env.DPD_SENDER_STREET || "Your Street",
          houseNo: process.env.DPD_SENDER_HOUSE_NUMBER || "123",
          zipCode: process.env.DPD_SENDER_POSTAL_CODE || "12345",
          city: process.env.DPD_SENDER_CITY || "Your City",
          country: process.env.DPD_SENDER_COUNTRY || "DE",
          email: process.env.DPD_SENDER_EMAIL || "shipping@yourcompany.com",
        },
        recipient: {
          name1: order.shippingAddress.name,
          street: order.shippingAddress.line1,
          houseNo: order.shippingAddress.line2 || "",
          zipCode: order.shippingAddress.postalCode,
          city: order.shippingAddress.city,
          country: order.shippingAddress.country,
          email: order.customerEmail,
        },
      },
      parcels: {
        parcel: {
          customerReferenceNumber1: order.orderNumber,
          weight: calculateOrderWeight(order),
        },
      },
      productAndServiceData: {
        orderType: "consignment",
      },
    },
  };

  try {
    // Build SOAP XML request
    const soapRequest = buildDPDSoapRequest(shipmentData);

    const response = await fetch(`${DPD_API_BASE_URL}/ShipmentService/V3_2/`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://dpd.com/common/service/ShipmentService/V3_2/storeOrders",
      },
      body: soapRequest,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DPD API Error:", errorText);
      throw new Error(`DPD API error: ${response.status} - ${response.statusText}`);
    }

    const responseText = await response.text();
    const parsedResponse = parseDPDResponse(responseText);

    if (!parsedResponse.success) {
      throw new Error(`DPD shipment creation failed: ${parsedResponse.error}`);
    }

    return {
      trackingNumber: parsedResponse.parcelLabelNumber,
      labelUrl: parsedResponse.labelUrl || null,
      trackingUrl: generateDPDTrackingUrl(parsedResponse.parcelLabelNumber),
      carrier: "dpd",
      carrierResponse: parsedResponse,
    };
  } catch (error) {
    console.error("Failed to create DPD shipment:", error);
    throw error;
  }
}

/**
 * Get tracking information for a DPD shipment
 * @param {string} trackingNumber - DPD tracking number
 * @returns {Promise<Object>} Tracking information
 */
export async function getDPDTracking(trackingNumber) {
  const delisId = process.env.DPD_DELIS_ID;
  const password = process.env.DPD_PASSWORD;

  if (!delisId || !password) {
    throw new Error("DPD API credentials not configured");
  }

  try {
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                        xmlns:ns="http://dpd.com/common/service/types/TrackingService/2.0">
        <soapenv:Header>
          <ns:authentication>
            <delisId>${delisId}</delisId>
            <password>${password}</password>
          </ns:authentication>
        </soapenv:Header>
        <soapenv:Body>
          <ns:getTrackingData>
            <parcelLabelNumber>${trackingNumber}</parcelLabelNumber>
          </ns:getTrackingData>
        </soapenv:Body>
      </soapenv:Envelope>`;

    const response = await fetch(`${DPD_API_BASE_URL}/TrackingService/V2_0/`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://dpd.com/common/service/TrackingService/V2_0/getTrackingData",
      },
      body: soapRequest,
    });

    if (!response.ok) {
      throw new Error(`DPD tracking API error: ${response.status}`);
    }

    const responseText = await response.text();
    return parseDPDTrackingResponse(responseText);
  } catch (error) {
    console.error("Failed to get DPD tracking:", error);
    throw error;
  }
}

/**
 * Generate DPD tracking URL
 * @param {string} trackingNumber - DPD tracking number
 * @returns {string} Tracking URL
 */
export function generateDPDTrackingUrl(trackingNumber) {
  return `${DPD_TRACKING_URL}?query=${trackingNumber}&locale=de_DE`;
}

/**
 * Calculate total order weight in kg (DPD uses kg)
 * @param {Object} order - Order object
 * @returns {number} Weight in kg
 */
function calculateOrderWeight(order) {
  const DEFAULT_ITEM_WEIGHT = 100; // grams
  let totalWeight = 0;
  
  for (const item of order.items) {
    const itemWeight = item.weightGrams || DEFAULT_ITEM_WEIGHT;
    totalWeight += itemWeight * item.quantity;
  }
  
  // Add packaging weight
  const PACKAGING_WEIGHT = 50; // grams
  totalWeight += PACKAGING_WEIGHT;
  
  // Convert to kg and round to 2 decimals
  return Math.round((totalWeight / 1000) * 100) / 100;
}

/**
 * Build SOAP XML request for DPD shipment creation
 * @param {Object} data - Shipment data
 * @returns {string} SOAP XML request
 */
function buildDPDSoapRequest(data) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                      xmlns:ns="http://dpd.com/common/service/types/ShipmentService/3.2">
      <soapenv:Header>
        <ns:authentication>
          <delisId>${data.delisId}</delisId>
          <password>${data.password}</password>
        </ns:authentication>
      </soapenv:Header>
      <soapenv:Body>
        <ns:storeOrders>
          <order>
            <generalShipmentData>
              <sendingDepot>${data.shipment.generalShipmentData.sendingDepot}</sendingDepot>
              <product>${data.shipment.generalShipmentData.product}</product>
              <sender>
                <name1>${escapeXml(data.shipment.generalShipmentData.sender.name1)}</name1>
                <street>${escapeXml(data.shipment.generalShipmentData.sender.street)}</street>
                <houseNo>${escapeXml(data.shipment.generalShipmentData.sender.houseNo)}</houseNo>
                <zipCode>${data.shipment.generalShipmentData.sender.zipCode}</zipCode>
                <city>${escapeXml(data.shipment.generalShipmentData.sender.city)}</city>
                <country>${data.shipment.generalShipmentData.sender.country}</country>
                <email>${data.shipment.generalShipmentData.sender.email}</email>
              </sender>
              <recipient>
                <name1>${escapeXml(data.shipment.generalShipmentData.recipient.name1)}</name1>
                <street>${escapeXml(data.shipment.generalShipmentData.recipient.street)}</street>
                <houseNo>${escapeXml(data.shipment.generalShipmentData.recipient.houseNo)}</houseNo>
                <zipCode>${data.shipment.generalShipmentData.recipient.zipCode}</zipCode>
                <city>${escapeXml(data.shipment.generalShipmentData.recipient.city)}</city>
                <country>${data.shipment.generalShipmentData.recipient.country}</country>
                <email>${data.shipment.generalShipmentData.recipient.email}</email>
              </recipient>
            </generalShipmentData>
            <parcels>
              <parcel>
                <customerReferenceNumber1>${data.shipment.parcels.parcel.customerReferenceNumber1}</customerReferenceNumber1>
                <weight>${data.shipment.parcels.parcel.weight}</weight>
              </parcel>
            </parcels>
            <productAndServiceData>
              <orderType>${data.shipment.productAndServiceData.orderType}</orderType>
            </productAndServiceData>
          </order>
        </ns:storeOrders>
      </soapenv:Body>
    </soapenv:Envelope>`;
}

/**
 * Parse DPD SOAP response
 * @param {string} xmlResponse - SOAP XML response
 * @returns {Object} Parsed response
 */
function parseDPDResponse(xmlResponse) {
  // Simple XML parsing (in production, use a proper XML parser like 'fast-xml-parser')
  const parcelLabelNumberMatch = xmlResponse.match(/<parcelLabelNumber>([^<]+)<\/parcelLabelNumber>/);
  const faultMatch = xmlResponse.match(/<faultstring>([^<]+)<\/faultstring>/);

  if (faultMatch) {
    return {
      success: false,
      error: faultMatch[1],
    };
  }

  if (parcelLabelNumberMatch) {
    return {
      success: true,
      parcelLabelNumber: parcelLabelNumberMatch[1],
      labelUrl: null, // DPD typically returns label as base64 in response
    };
  }

  return {
    success: false,
    error: "Unable to parse DPD response",
  };
}

/**
 * Parse DPD tracking response
 * @param {string} xmlResponse - SOAP XML response
 * @returns {Object} Parsed tracking data
 */
function parseDPDTrackingResponse(xmlResponse) {
  // Simple parsing - in production use proper XML parser
  const statusMatch = xmlResponse.match(/<statusInfo>([^<]+)<\/statusInfo>/);
  const locationMatch = xmlResponse.match(/<location>([^<]+)<\/location>/);
  
  return {
    status: statusMatch ? statusMatch[1] : "Unknown",
    location: locationMatch ? locationMatch[1] : null,
    rawResponse: xmlResponse,
  };
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, String.fromCharCode(38) + 'amp;')
    .replace(/</g, String.fromCharCode(38) + 'lt;')
    .replace(/>/g, String.fromCharCode(38) + 'gt;')
    .replace(/"/g, String.fromCharCode(38) + 'quot;')
    .replace(/'/g, String.fromCharCode(38) + 'apos;');
}

/**
 * Validate DPD API credentials
 * @returns {Promise<boolean>} True if credentials are valid
 */
export async function validateDPDCredentials() {
  const delisId = process.env.DPD_DELIS_ID;
  const password = process.env.DPD_PASSWORD;

  if (!delisId || !password) {
    return false;
  }

  try {
    // Test with a simple authentication request
    const testRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Header>
          <authentication>
            <delisId>${delisId}</delisId>
            <password>${password}</password>
          </authentication>
        </soapenv:Header>
        <soapenv:Body/>
      </soapenv:Envelope>`;

    const response = await fetch(`${DPD_API_BASE_URL}/ShipmentService/V3_2/`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
      body: testRequest,
    });

    const responseText = await response.text();
    return !responseText.includes("AuthenticationFault");
  } catch (error) {
    console.error("DPD credential validation failed:", error);
    return false;
  }
}

// Made with Bob