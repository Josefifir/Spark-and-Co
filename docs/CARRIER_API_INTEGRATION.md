# Carrier API Integration Guide

## Overview

This guide covers the integration of DHL and DPD carrier APIs for automatic shipping label generation and tracking. The system supports automatic label creation, tracking number generation, and tracking URL creation.

## Supported Carriers

### 1. DHL (Deutsche Post DHL)
- **API**: DHL Parcel Germany Shipping API v2
- **Services**: Standard (V01PAK), Express (V53WPAK)
- **Features**: Label generation, tracking, delivery estimates
- **Documentation**: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2

### 2. DPD (Dynamic Parcel Distribution)
- **API**: DPD Web Services (SOAP)
- **Services**: Classic (101), Express (CL)
- **Features**: Label generation, tracking, delivery estimates
- **Documentation**: https://esolutions.dpd.com/dokumente/

---

## Environment Variables

Add these to your `.env.local` file:

```env
# DHL API Configuration
DHL_API_KEY=your_dhl_api_key
DHL_API_SECRET=your_dhl_api_secret
DHL_ACCOUNT_NUMBER=your_dhl_account_number
DHL_API_URL=https://api-sandbox.dhl.com/parcel/de/shipping/v2  # Use production URL in production

# DHL Shipper Information (Your Company)
DHL_SHIPPER_NAME=Your Company Name
DHL_SHIPPER_STREET=Your Street Name
DHL_SHIPPER_HOUSE_NUMBER=123
DHL_SHIPPER_POSTAL_CODE=12345
DHL_SHIPPER_CITY=Your City
DHL_SHIPPER_COUNTRY=DE
DHL_SHIPPER_EMAIL=shipping@yourcompany.com

# DHL Tracking API (optional, uses DHL_API_KEY if not set)
DHL_TRACKING_API_KEY=your_tracking_api_key

# DPD API Configuration
DPD_DELIS_ID=your_dpd_delis_id
DPD_PASSWORD=your_dpd_password
DPD_DEPOT_NUMBER=your_depot_number
DPD_API_URL=https://public-dis.dpd.nl/services  # Production URL

# DPD Sender Information (Your Company)
DPD_SENDER_NAME=Your Company Name
DPD_SENDER_STREET=Your Street Name
DPD_SENDER_HOUSE_NUMBER=123
DPD_SENDER_POSTAL_CODE=12345
DPD_SENDER_CITY=Your City
DPD_SENDER_COUNTRY=DE
DPD_SENDER_EMAIL=shipping@yourcompany.com
```

---

## API Modules

### DHL Module (`lib/carriers/dhl.js`)

#### Functions

**`createDHLShipment(order, options)`**
- Creates a DHL shipment and generates shipping label
- **Parameters**:
  - `order`: Order object with shipping details
  - `options`: `{ express: boolean }` - Use express service
- **Returns**: Promise with shipment details
  ```javascript
  {
    trackingNumber: "00340434161094015902",
    labelUrl: "https://...",
    trackingUrl: "https://www.dhl.de/...",
    carrier: "dhl",
    carrierResponse: {...}
  }
  ```

**`getDHLTracking(trackingNumber)`**
- Get tracking information for a DHL shipment
- **Parameters**: `trackingNumber` - DHL tracking number
- **Returns**: Promise with tracking data

**`generateDHLTrackingUrl(trackingNumber)`**
- Generate DHL tracking URL
- **Parameters**: `trackingNumber` - DHL tracking number
- **Returns**: Tracking URL string

**`validateDHLCredentials()`**
- Validate DHL API credentials
- **Returns**: Promise<boolean>

#### Usage Example

```javascript
import { createDHLShipment } from '@/lib/carriers/dhl';

const shipment = await createDHLShipment(order, { express: false });
console.log('Tracking:', shipment.trackingNumber);
console.log('Label:', shipment.labelUrl);
```

---

### DPD Module (`lib/carriers/dpd.js`)

#### Functions

**`createDPDShipment(order, options)`**
- Creates a DPD shipment and generates shipping label
- **Parameters**:
  - `order`: Order object with shipping details
  - `options`: `{ express: boolean }` - Use express service
- **Returns**: Promise with shipment details
  ```javascript
  {
    trackingNumber: "05400100000001234567",
    labelUrl: null,  // DPD returns label as base64
    trackingUrl: "https://tracking.dpd.de/...",
    carrier: "dpd",
    carrierResponse: {...}
  }
  ```

**`getDPDTracking(trackingNumber)`**
- Get tracking information for a DPD shipment
- **Parameters**: `trackingNumber` - DPD tracking number
- **Returns**: Promise with tracking data

**`generateDPDTrackingUrl(trackingNumber)`**
- Generate DPD tracking URL
- **Parameters**: `trackingNumber` - DPD tracking number
- **Returns**: Tracking URL string

**`validateDPDCredentials()`**
- Validate DPD API credentials
- **Returns**: Promise<boolean>

#### Usage Example

```javascript
import { createDPDShipment } from '@/lib/carriers/dpd';

const shipment = await createDPDShipment(order, { express: true });
console.log('Tracking:', shipment.trackingNumber);
```

---

## Admin API Endpoint

### Generate Shipping Label

**Endpoint**: `POST /api/admin/orders/[id]/generate-label`

**Authentication**: Requires admin authentication

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "trackingNumber": "00340434161094015902",
  "trackingUrl": "https://www.dhl.de/...",
  "labelUrl": "https://...",
  "carrier": "dhl"
}
```

**Error Response**:
```json
{
  "error": "Failed to generate DHL label: Invalid credentials",
  "details": "Authentication failed"
}
```

**Conditions**:
- Order must be paid (`paymentStatus === "paid"`)
- Order must not already have a tracking number
- Order must have carrier information in `shippingMethod`
- Carrier must be supported (DHL or DPD)

---

## Admin UI Integration

### Label Generation Button

The admin order detail page (`app/admin/orders/[id]/page.jsx`) includes:

1. **Automatic Label Generation**
   - Shows when order is paid and has no tracking number
   - Displays carrier name (DHL/DPD)
   - One-click label generation
   - Loading state during generation

2. **Tracking Information Display**
   - Shows tracking number with carrier badge
   - Link to track shipment
   - Link to download label (if available)

### UI Components

```jsx
{/* Label Generation Section */}
{order.paymentStatus === "paid" && !order.trackingNumber && order.shippingMethod?.carrier && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
    <Button onClick={handleGenerateLabel} disabled={generatingLabel}>
      Generate {order.shippingMethod.carrier.toUpperCase()} Label
    </Button>
  </div>
)}

{/* Tracking Display */}
{order.trackingNumber && (
  <div className="p-4 bg-panel-raised rounded border border-hairline">
    <p className="font-mono-tech">{order.trackingNumber}</p>
    <a href={order.trackingUrl}>Track Shipment</a>
    <a href={order.shippingLabelUrl}>Download Label</a>
  </div>
)}
```

---

## Order Model Updates

The Order model includes these shipping-related fields:

```javascript
{
  trackingNumber: String,
  trackingUrl: String,
  shippingLabelUrl: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  shippingMethod: {
    name: String,
    carrier: String,  // 'dhl', 'dpd', etc.
    carrierService: String,
    estimatedMinDays: Number,
    estimatedMaxDays: Number,
    cost: Number,
  }
}
```

---

## Weight Calculation

Both carriers require package weight. The system calculates weight as follows:

```javascript
function calculateOrderWeight(order) {
  const DEFAULT_ITEM_WEIGHT = 100; // grams per item
  let totalWeight = 0;
  
  for (const item of order.items) {
    const itemWeight = item.weightGrams || DEFAULT_ITEM_WEIGHT;
    totalWeight += itemWeight * item.quantity;
  }
  
  // Add packaging weight
  const PACKAGING_WEIGHT = 50; // grams
  totalWeight += PACKAGING_WEIGHT;
  
  return totalWeight; // in grams for DHL, converted to kg for DPD
}
```

**To improve accuracy**: Add `weightGrams` field to products in the database.

---

## Error Handling

### Common Errors

1. **Missing Credentials**
   ```
   Error: DHL API credentials not configured
   ```
   **Solution**: Set all required environment variables

2. **Authentication Failed**
   ```
   Error: DHL API error: 401 - Unauthorized
   ```
   **Solution**: Verify API key and secret are correct

3. **Invalid Address**
   ```
   Error: DHL API error: 400 - Invalid postal code
   ```
   **Solution**: Verify shipping address is complete and valid

4. **Label Already Generated**
   ```
   Error: Shipping label already generated for this order
   ```
   **Solution**: Order already has tracking number, cannot regenerate

### Error Logging

All carrier API errors are logged to console with full details:

```javascript
console.error("DHL API Error:", errorData);
console.error("Failed to create DHL shipment:", error);
```

---

## Testing

### Test Credentials

**DHL Sandbox**:
- API URL: `https://api-sandbox.dhl.com/parcel/de/shipping/v2`
- Get test credentials from: https://developer.dhl.com/

**DPD Test Environment**:
- Contact DPD for test credentials
- Test depot numbers and authentication

### Test Workflow

1. **Create Test Order**
   - Place order with test payment
   - Mark as paid in admin

2. **Generate Label**
   - Go to admin order detail page
   - Click "Generate Label" button
   - Verify tracking number appears

3. **Test Tracking**
   - Click "Track Shipment" link
   - Verify tracking page opens

4. **Test Label Download**
   - Click "Download Label" link (DHL only)
   - Verify PDF label downloads

### Manual Testing

```bash
# Test DHL credentials
curl -X GET https://api-sandbox.dhl.com/parcel/de/shipping/v2/orders \
  -H "Authorization: Basic $(echo -n 'API_KEY:API_SECRET' | base64)"

# Test DPD credentials (SOAP request)
# Use Postman or SOAP UI with provided WSDL
```

---

## Production Deployment

### Checklist

- [ ] Obtain production API credentials from DHL
- [ ] Obtain production API credentials from DPD
- [ ] Update environment variables with production credentials
- [ ] Change API URLs to production endpoints
- [ ] Test with real orders in staging environment
- [ ] Set up error monitoring and alerts
- [ ] Configure backup label generation process
- [ ] Train staff on label generation workflow

### Production URLs

```env
# DHL Production
DHL_API_URL=https://api-eu.dhl.com/parcel/de/shipping/v2

# DPD Production
DPD_API_URL=https://public-dis.dpd.nl/services
```

---

## Monitoring and Maintenance

### Metrics to Track

1. **Label Generation Success Rate**
   - Track successful vs failed label generations
   - Monitor by carrier

2. **API Response Times**
   - DHL API latency
   - DPD API latency

3. **Error Rates**
   - Authentication errors
   - Validation errors
   - Network errors

### Logging

Implement structured logging for carrier API calls:

```javascript
console.log({
  event: 'label_generation',
  carrier: 'dhl',
  orderId: order._id,
  orderNumber: order.orderNumber,
  success: true,
  trackingNumber: shipment.trackingNumber,
  timestamp: new Date().toISOString()
});
```

---

## Future Enhancements

### Planned Features

1. **Additional Carriers**
   - UPS integration
   - FedEx integration
   - USPS integration
   - Royal Mail integration

2. **Advanced Features**
   - Batch label generation
   - Automatic tracking updates
   - Delivery notifications
   - Return label generation
   - Customs documentation for international shipments

3. **Optimization**
   - Rate shopping (compare carrier rates)
   - Automatic carrier selection
   - Package optimization
   - Multi-package shipments

4. **Customer Features**
   - Delivery date selection
   - Pickup point selection
   - SMS tracking notifications
   - Real-time tracking updates

---

## Troubleshooting

### DHL Issues

**Problem**: "Invalid product code"
- **Solution**: Verify product code matches your DHL contract (V01PAK for standard, V53WPAK for express)

**Problem**: "Invalid account number"
- **Solution**: Check DHL_ACCOUNT_NUMBER matches your billing number

**Problem**: "Label URL not returned"
- **Solution**: Check API response format, may need to extract from different field

### DPD Issues

**Problem**: "SOAP fault: Authentication failed"
- **Solution**: Verify DPD_DELIS_ID and DPD_PASSWORD are correct

**Problem**: "Invalid depot number"
- **Solution**: Check DPD_DEPOT_NUMBER matches your assigned depot

**Problem**: "XML parsing error"
- **Solution**: Check SOAP request format, ensure proper XML escaping

---

## Support

### DHL Support
- Developer Portal: https://developer.dhl.com/
- Support Email: developer.support@dhl.com
- Documentation: https://developer.dhl.com/api-reference

### DPD Support
- E-Solutions Portal: https://esolutions.dpd.com/
- Support: Contact your DPD account manager
- Documentation: Available in customer portal

---

## Made with Bob 🔥

Complete carrier API integration with DHL and DPD for automatic shipping label generation, tracking, and fulfillment management.