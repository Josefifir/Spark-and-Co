// test-dhl.js
const axios = require('axios');

async function testDHL() {
  const username = 'user-valid';
  const password = 'SandboxPasswort2023!';
  const apiKey = process.env.DHL_API_KEY;
  const billingNumber = process.env.DHL_BILLING_NUMBER;

  console.log('=== DHL Sandbox Test ===');
  console.log('Billing Number:', billingNumber);

  const encodedAuth = Buffer.from(`${username}:${password}`).toString('base64');

  const shipmentData = {
    profile: "STANDARD_GRUPPENPROFIL",
    shipments: [{
      product: "V01PAK",
      billingNumber: billingNumber,
      refNo: "TEST-" + Date.now(),
      shipDate: new Date().toISOString().split('T')[0],
      shipper: {
        name1: "Spark & Co",
        addressStreet: "Musterstraße",
        addressHouse: "1",
        postalCode: "52062",
        city: "Aachen",
        country: { countryISOCode: "DE" }
      },
      consignee: {
        name1: "Test Empfänger",
        addressStreet: "Teststraße",
        addressHouse: "42",
        postalCode: "50667",
        city: "Köln",
        country: { countryISOCode: "DE" }
      },
      details: {
        weight: {
          uom: "g",
          value: 500
        },
        dimensions: {   // ← Changed from "dimension" to "dimensions"
          length: 30,
          width: 20,
          height: 10,
          uom: "cm"
        }
      }
    }]
  };

  const url = "https://api-sandbox.dhl.com/parcel/de/shipping/v2/orders?validate=true&docFormat=PDF";

  try {
    const response = await axios.post(url, shipmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedAuth}`,
        'dhl-api-key': apiKey,
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Shipment No:', response.data?.items?.[0]?.shipmentNo);

  } catch (error) {
    console.log('\n❌ FAILED - Status:', error.response?.status);
    if (error.response?.data) {
      console.dir(error.response.data, { depth: null });
    } else {
      console.log(error.message);
    }
  }
}

testDHL();