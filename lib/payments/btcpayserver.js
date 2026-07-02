/**
 * Minimal BTCPay Server API client using fetch directly.
 *
 * BTCPay Server is self-hosted (or hosted via third parties) and works
 * globally — unlike Coinbase Commerce which is US-restricted.
 *
 * Docs: https://docs.btcpayserver.org/API/Greenfield/v1/
 */

function getConfig() {
  const host = process.env.BTCPAY_HOST;
  const apiKey = process.env.BTCPAY_API_KEY;
  const storeId = process.env.BTCPAY_STORE_ID;

  if (!host || !apiKey || !storeId) {
    throw new Error("BTCPAY_HOST, BTCPAY_API_KEY, and BTCPAY_STORE_ID must be set.");
  }

  return { host: host.replace(/\/$/, ""), apiKey, storeId };
}

/**
 * Create a BTCPay Server invoice.
 *
 * @param {object} opts
 * @param {string} opts.orderNumber
 * @param {number} opts.amountCents  Amount in the smallest currency unit (cents)
 * @param {string} opts.currency     ISO 4217 currency code, e.g. "USD"
 * @param {string} opts.customerEmail
 * @param {string} opts.redirectUrl  Where to send the buyer after payment
 * @returns {Promise<{id: string, checkoutLink: string}>}
 */
export async function createBtcpayInvoice({ orderNumber, amountCents, currency, customerEmail, redirectUrl }) {
  const { host, apiKey, storeId } = getConfig();

  const res = await fetch(`${host}/api/v1/stores/${storeId}/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${apiKey}`,
    },
    body: JSON.stringify({
      amount: (amountCents / 100).toFixed(2),
      currency: currency.toUpperCase(),
      orderId: orderNumber,
      buyerEmail: customerEmail,
      redirectURL: redirectUrl,
      checkout: {
        redirectAutomatically: true,
      },
      metadata: { orderNumber },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`BTCPay Server error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  // id       — invoice ID used for webhook matching
  // checkoutLink — the URL to redirect the buyer to
  return { id: data.id, checkoutLink: data.checkoutLink };
}
