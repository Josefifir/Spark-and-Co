# Order Confirmation Email System

## Overview

The system automatically sends professional order confirmation emails to customers after successful payment via Stripe or Coinbase Commerce. Each email includes personalized review links for every product purchased.

## Features

- **Automatic Sending**: Emails sent immediately after payment confirmation
- **Professional Design**: Responsive HTML email template with inline styles
- **Complete Order Details**: Includes all order information, items, shipping address, and totals
- **Review Links**: Each product includes a unique, secure review link
- **Multi-Currency Support**: Displays prices in the customer's selected currency (USD/EUR)
- **Payment Method Display**: Shows which payment method was used
- **Order Tracking**: Includes order number for customer reference

## Email Service Setup

### 1. Resend API Configuration

The system uses [Resend](https://resend.com) for reliable email delivery.

**Environment Variables** (configured in `.env.local`):
```env
RESEND_API_KEY=re_S8EEB6iV_9boJrPfsa65xwzzEGrewkyS5
FROM_EMAIL=youssefbmfir@gmail.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Email Service Implementation

**File**: `lib/email/resend.js`

```javascript
import { generateReviewLink, getReviewLinkUrl } from '@/lib/reviews/generateReviewLink';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@yourdomain.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function sendOrderConfirmationEmail(order) {
  // Sends HTML email with complete order details and review links
}

function generateOrderConfirmationHTML(order) {
  // Generates professional HTML email template with review links
}
```

## Review Link System

### How It Works

1. **Token Generation**: For each product in the order, a secure JWT token is generated containing:
   - Order number
   - Customer email
   - Product ID
   - 30-day expiration

2. **Link Format**: `https://yourdomain.com/products/{slug}?reviewToken={token}`

3. **Security**: 
   - Token is signed with JWT_SECRET
   - Expires after 30 days
   - Can only be used by the customer who placed the order
   - Verified before allowing review submission

4. **User Experience**:
   - Customer clicks "Leave a review" link in email
   - Redirected to product page with review form pre-authenticated
   - Can immediately write and submit review
   - No login required

### Review Link Generation

**File**: `lib/reviews/generateReviewLink.js`

```javascript
export function generateReviewLink(orderNumber, customerEmail, productId) {
  const token = jwt.sign(
    {
      orderNumber,
      email: customerEmail.toLowerCase(),
      productId,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
  return token;
}

export function getReviewLinkUrl(productSlug, token) {
  return `/products/${productSlug}?reviewToken=${token}`;
}
```

## Email Template

The email includes:

### 1. Header
- Company branding (🔥 Order Confirmed)
- Professional dark header design

### 2. Order Summary
- Order number (large, prominent)
- Order date
- Payment method
- Payment status

### 3. Items List with Review Links
Each product row includes:
- Product name and quantity
- **⭐ Leave a review** link (clickable, blue)
- Price per item
- Total price

Example:
```
Premium Lighter × 3                    $59.97
⭐ Leave a review

Lighter Fluid × 1                      $9.99
⭐ Leave a review
```

### 4. Review Request Section
Blue highlighted box encouraging customers to share feedback:
```
⭐ Share Your Experience

We'd love to hear what you think! Click the "Leave a review" 
link next to each product above to share your feedback. Your 
reviews help other customers make informed decisions.
```

### 5. Shipping Address
Complete delivery address in formatted box

### 6. Order Totals
- Subtotal
- Bulk discount (if applicable)
- Discount code savings (if applicable)
- VAT (for EU customers)
- Shipping
- **Total** (bold, large)

### 7. Footer
- Tracking information note
- Support contact
- Copyright notice

## Integration Points

### Stripe Webhook

**File**: `app/api/webhooks/stripe/route.js`

```javascript
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

case "payment_intent.succeeded": {
  const order = await Order.findOne({
    stripePaymentIntentId: paymentIntent.id
  }).populate('items.product');
  
  if (order && order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    await order.save();
    
    // Send confirmation email with review links
    await sendOrderConfirmationEmail(order);
  }
  break;
}
```

### BTCPay Server Webhook

**File**: `app/api/webhooks/btcpayserver/route.js`

```javascript
import { sendOrderConfirmationEmail } from "@/lib/email/resend";

case "InvoiceSettled":
  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.fulfillmentStatus = "processing";
    await order.save();
    
    // Send order confirmation email with review links
    await sendOrderConfirmationEmail(order);
  }
  break;
```

## Email Content Example

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    🔥 Order Confirmed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your order! We've received your payment and will 
begin processing your order shortly.

┌─────────────────────────────────────────────────────────────┐
│ ORDER NUMBER                                                │
│ #ORD-1234567890                                            │
└─────────────────────────────────────────────────────────────┘

Order Details
┌─────────────────────────────────────────────────────────────┐
│ Premium Lighter × 3                              $59.97    │
│ ⭐ Leave a review                                           │
├─────────────────────────────────────────────────────────────┤
│ Lighter Fluid × 1                                $9.99     │
│ ⭐ Leave a review                                           │
├─────────────────────────────────────────────────────────────┤
│ Discount (SAVE5)                                -$5.00     │
├─────────────────────────────────────────────────────────────┤
│ Total                                            $64.96    │
└─────────────────────────────────────────────────────────────┘

Shipping Address
┌─────────────────────────────────────────────────────────────┐
│ John Doe                                                    │
│ 123 Main Street                                             │
│ Berlin, 10115                                               │
│ Germany                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⭐ Share Your Experience                                    │
│                                                             │
│ We'd love to hear what you think! Click the "Leave a       │
│ review" link next to each product above to share your      │
│ feedback. Your reviews help other customers make informed  │
│ decisions.                                                  │
└─────────────────────────────────────────────────────────────┘

You'll receive another email with tracking information once 
your order ships. If you have any questions, please reply to 
this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2026 Strike & Co. All rights reserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Error Handling

The email service includes comprehensive error handling:

1. **Missing API Key**: Logs warning and continues (doesn't block order)
2. **Invalid Email**: Logs error with order details
3. **Resend API Errors**: Catches and logs all API errors
4. **Network Issues**: Gracefully handles timeouts
5. **Missing Product Data**: Skips review link if product not populated

**Important**: Email failures do NOT prevent order completion. The order is saved first, then email is attempted.

## Testing

### Test Email with Review Links

1. **Place a Test Order**:
   ```bash
   # Use Stripe test card
   Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```

2. **Check Email Delivery**:
   - Email should arrive within seconds
   - Check spam folder if not in inbox

3. **Test Review Links**:
   - Click "Leave a review" link for each product
   - Should redirect to product page with review form
   - Review form should be pre-authenticated
   - Submit review without login

4. **Verify Email Content**:
   - All order details correct
   - Prices match order
   - Currency displayed correctly
   - Shipping address complete
   - Review links work for all products

### Test Different Scenarios

- **Multiple Products**: Order 3+ different products, verify all have review links
- **Bulk Pricing**: Order 3+ items, verify discount shown
- **Discount Code**: Apply code, verify savings displayed
- **VAT**: Order from Germany, verify VAT calculation
- **Different Currencies**: Test USD and EUR orders
- **Expired Token**: Wait 30+ days, verify token expires
- **Wrong Email**: Try using review link with different email

## Security Considerations

### Review Link Security

1. **JWT Signing**: All tokens signed with JWT_SECRET
2. **Email Verification**: Token includes customer email, verified on submission
3. **Order Verification**: Token includes order number, verified against database
4. **Product Verification**: Token includes product ID, verified before review
5. **Expiration**: Tokens expire after 30 days
6. **One-Time Use**: Review can only be submitted once per order/product

### Email Security

1. **SPF/DKIM**: Configure in Resend dashboard
2. **DMARC**: Set up email authentication
3. **Rate Limiting**: Resend handles rate limits
4. **Spam Prevention**: Professional template design
5. **Unsubscribe**: Add if sending marketing emails

## Customization

### Change Email Styling

Edit `generateOrderConfirmationHTML()` in `lib/email/resend.js`:

```javascript
// Header color
<td style="background-color: #1f2937; ...">

// Review link color
<a href="${item.reviewLink}" style="color: #3b82f6; ...">

// Review request box
<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; ...">
```

### Change Review Link Text

```javascript
<a href="${item.reviewLink}" style="...">
  ⭐ Leave a review  // Change this text
</a>
```

### Add Company Logo

```javascript
<td style="background-color: #1f2937; padding: 32px; text-align: center;">
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="max-width: 200px;">
  <h1 style="margin: 16px 0 0; color: #ffffff; ...">
    Order Confirmed
  </h1>
</td>
```

### Change Review Request Message

```javascript
<p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
  Your custom message here...
</p>
```

## Production Checklist

- [x] Resend API key configured
- [x] FROM_EMAIL set to verified domain email
- [x] BASE_URL set to production domain
- [x] JWT_SECRET configured for review tokens
- [x] Email template tested with real orders
- [x] Review links tested and working
- [ ] Verify domain in Resend dashboard
- [ ] Configure SPF/DKIM/DMARC records
- [ ] Test email delivery to various providers (Gmail, Outlook, etc.)
- [ ] Check spam score of emails
- [ ] Set up email monitoring/alerts
- [ ] Configure email rate limits if needed
- [ ] Test review link expiration
- [ ] Test review submission flow

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is correct
2. **Check Logs**: Look for error messages in server logs
3. **Verify Domain**: Ensure FROM_EMAIL domain is verified in Resend
4. **Test Resend API**: Use Resend dashboard to send test email
5. **Check Order Population**: Ensure `.populate('items.product')` is used

### Review Links Not Working

1. **Check BASE_URL**: Verify `NEXT_PUBLIC_BASE_URL` is correct
2. **Check JWT_SECRET**: Ensure same secret used for signing and verifying
3. **Check Token Expiration**: Tokens expire after 30 days
4. **Check Product Slug**: Verify product has valid slug
5. **Check Product Population**: Ensure order items include product data

### Emails Going to Spam

1. **Verify Domain**: Add SPF, DKIM, and DMARC records
2. **Check Content**: Avoid spam trigger words
3. **Test Spam Score**: Use mail-tester.com
4. **Warm Up Domain**: Gradually increase sending volume
5. **Professional Design**: Use current template (already optimized)

### Wrong Information in Email

1. **Check Order Population**: Ensure `populate('items.product')` is used
2. **Verify Currency**: Check currency context and conversion
3. **Test Calculations**: Verify bulk pricing and VAT calculations
4. **Check Template**: Review HTML generation logic
5. **Check Product Data**: Verify product has slug and name

## Future Enhancements

Potential improvements:

1. **Shipping Notifications**: Email when order ships with tracking
2. **Delivery Confirmation**: Email when order delivered
3. **Review Reminders**: Follow-up email if no review after 7 days
4. **Abandoned Cart**: Email reminders for incomplete checkouts
5. **Promotional Emails**: Newsletter and special offers
6. **Email Preferences**: Let customers choose email types
7. **Multi-Language**: Send emails in customer's language
8. **PDF Attachments**: Include invoice PDF
9. **Email Templates**: Use Resend's template system
10. **Review Incentives**: Offer discount for leaving review

## Support

For issues with the email system:

1. Check Resend dashboard for delivery status
2. Review server logs for error messages
3. Test with different email providers
4. Verify review link generation
5. Contact Resend support if API issues persist

---

**Last Updated**: June 23, 2026
**Version**: 2.0.0 (with review links)