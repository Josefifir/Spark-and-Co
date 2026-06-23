/**
 * Minimal Coinbase Commerce API client using fetch directly.
 * We avoid the official `coinbase-commerce-node` package since it is
 * unmaintained and pulls in outdated/vulnerable dependencies.
 *
 * Docs: https://docs.cdp.coinbase.com/commerce-onchain/docs/getting-started
 */

const COINBASE_API_BASE = "https://api.commerce.coinbase.com";

function getApiKey() {
  const key = process.env.COINBASE_COMMERCE_API_KEY;
  if (!key) {
    throw new Error("COINBASE_COMMERCE_API_KEY is not set.");
  }
  return key;
}

export async function createCoinbaseCharge({ name, description, amountCents, currency, orderNumber, metadata }) {
  const res = await fetch(`${COINBASE_API_BASE}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": getApiKey(),
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name,
      description,
      pricing_type: "fixed_price",
      local_price: {
        amount: (amountCents / 100).toFixed(2),
        currency: currency.toUpperCase(),
      },
      metadata: { orderNumber, ...metadata },
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order=${orderNumber}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Coinbase Commerce error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.data; // contains id, code, hosted_url, etc.
}

export async function getCoinbaseCharge(chargeId) {
  const res = await fetch(`${COINBASE_API_BASE}/charges/${chargeId}`, {
    headers: {
      "X-CC-Api-Key": getApiKey(),
      "X-CC-Version": "2018-03-22",
    },
  });
  if (!res.ok) throw new Error(`Coinbase Commerce error (${res.status})`);
  const data = await res.json();
  return data.data;
}
