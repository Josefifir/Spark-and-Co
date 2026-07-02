/**
 * SMS notifications via Twilio
 * Requires env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM  (E.164 format, e.g. +15005550006)
 *
 * All functions are no-ops when credentials are absent — safe to deploy without Twilio.
 */

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const FROM        = process.env.TWILIO_FROM;
const BASE_URL    = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";

function isConfigured() {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && FROM);
}

/**
 * Send an SMS via Twilio REST API.
 * Uses node-fetch (already in dependencies) to avoid requiring the full twilio SDK.
 */
async function sendSMS(to, body) {
  if (!isConfigured()) return;
  if (!to) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: FROM, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64"),
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[SMS] Twilio error:", err);
  }
}

/** Sent immediately when an order is paid */
export async function sendOrderConfirmationSMS(order) {
  if (!order.customerPhone) return;
  const total = (order.totalCents / 100).toFixed(2);
  const currency = (order.currency || "usd").toUpperCase();
  await sendSMS(
    order.customerPhone,
    `Spark & Co. — Order #${order.orderNumber} confirmed! Total: ${currency} ${total}. Track: ${BASE_URL}/order-lookup`
  );
}

/** Sent when the order ships (fulfillmentStatus = 'shipped') */
export async function sendShippingNotificationSMS(order) {
  if (!order.customerPhone) return;
  const tracking = order.trackingNumber
    ? ` Tracking: ${order.trackingUrl || order.trackingNumber}`
    : "";
  await sendSMS(
    order.customerPhone,
    `Spark & Co. — Your order #${order.orderNumber} has shipped!${tracking}`
  );
}

/** Sent when the order is delivered */
export async function sendDeliveryConfirmationSMS(order) {
  if (!order.customerPhone) return;
  await sendSMS(
    order.customerPhone,
    `Spark & Co. — Your order #${order.orderNumber} has been delivered. Enjoy! Leave a review: ${BASE_URL}/products`
  );
}
