/**
 * Email service using Resend API
 * https://resend.com/docs/send-with-nodejs
 */

import { generateReviewLink, getReviewLinkUrl } from '@/lib/reviews/generateReviewLink';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@yourdomain.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Send order confirmation email
 * @param {Object} order - Order object from database
 * @returns {Promise<Object>} Resend API response
 */
export async function sendOrderConfirmationEmail(order) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return { success: false, error: 'Email not configured' };
  }

  // In development, send to verified email to avoid Resend restrictions
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const recipientEmail = isDevelopment ? 'hagbardoldman@gmail.com' : order.customerEmail;
  
  if (isDevelopment) {
    console.log(`[DEV MODE] Sending email to ${recipientEmail} instead of ${order.customerEmail}`);
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: `Order Confirmation #${order.orderNumber}${isDevelopment ? ' [TEST]' : ''}`,
        html: generateOrderConfirmationHTML(order),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Email send failed' };
    }

    console.log('Order confirmation email sent:', order.orderNumber);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email template for order confirmation
 * @param {Object} order - Order object
 * @returns {string} HTML email content
 */
function generateOrderConfirmationHTML(order) {
  const formatPrice = (cents) => {
    const currency = order.currency?.toUpperCase() || 'USD';
    const symbol = currency === 'EUR' ? '€' : '$';
    return `${symbol}${(cents / 100).toFixed(2)}`;
  };

  // Generate review links for each product
  const itemsWithReviewLinks = order.items.map(item => {
    // Check if product is populated (it's an object with _id, slug, etc.)
    const product = item.product;
    let reviewLink = null;
    
    if (product && typeof product === 'object' && product._id && product.slug) {
      const token = generateReviewLink(order.orderNumber, order.customerEmail, product._id.toString());
      reviewLink = `${BASE_URL}${getReviewLinkUrl(product.slug, token)}`;
    }
    
    return {
      name: item.name, // Use snapshot name from order
      quantity: item.quantity,
      priceCents: item.priceCents, // Use snapshot price from order
      reviewLink: reviewLink
    };
  });

  const itemsHTML = itemsWithReviewLinks.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.name} × ${item.quantity}
        ${item.reviewLink ? `
          <br>
          <a href="${item.reviewLink}" style="color: #3b82f6; text-decoration: none; font-size: 13px; margin-top: 4px; display: inline-block;">
            ⭐ Leave a review
          </a>
        ` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        ${formatPrice(item.priceCents * item.quantity)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1f2937; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🔥 Order Confirmed
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.5;">
                Thank you for your order! We've received your payment and will begin processing your order shortly.
              </p>

              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                  Order Number
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 700;">
                  #${order.orderNumber}
                </p>
              </div>

              <!-- Order Items -->
              <h2 style="margin: 32px 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                Order Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                ${itemsHTML}
                ${order.discountAppliedCents > 0 ? `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #059669;">
                    Discount ${order.discountCodeUsed ? `(${order.discountCodeUsed})` : ''}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #059669;">
                    -${formatPrice(order.discountAppliedCents)}
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px; font-weight: 600; color: #1f2937;">
                    Total
                  </td>
                  <td style="padding: 12px; text-align: right; font-weight: 700; color: #1f2937; font-size: 18px;">
                    ${formatPrice(order.totalCents)}
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <h2 style="margin: 32px 0 16px; color: #1f2937; font-size: 18px; font-weight: 600;">
                Shipping Address
              </h2>
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px;">
                <p style="margin: 0; color: #374151; line-height: 1.6;">
                  ${order.shippingAddress.name}<br>
                  ${order.shippingAddress.line1}<br>
                  ${order.shippingAddress.line2 ? `${order.shippingAddress.line2}<br>` : ''}
                  ${order.shippingAddress.city}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode}<br>
                  ${order.shippingAddress.country}
                </p>
              </div>

              <!-- Review Request -->
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 32px 0;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: 600;">
                  ⭐ Share Your Experience
                </h3>
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                  We'd love to hear what you think! Click the "Leave a review" link next to each product above to share your feedback. Your reviews help other customers make informed decisions.
                </p>
              </div>

              <!-- Footer Note -->
              <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                You'll receive another email with tracking information once your order ships. If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} Strike & Co. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send low-stock alert to admin
 */
export async function sendLowStockAlert(product) {
  if (!RESEND_API_KEY) return;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const to = isDevelopment ? 'hagbardoldman@gmail.com' : adminEmail;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: `⚠️ Low stock alert: ${product.name}`,
      html: `<p><strong>${product.name}</strong> has dropped to <strong>${product.stock} units</strong> remaining (threshold: ${product.lowStockThreshold}).</p>
             <p>SKU: <code>${product.sku}</code></p>
             <p>Please reorder soon.</p>`,
    }),
  }).catch((e) => console.error('Low stock email failed:', e.message));
}

// Made with Bob