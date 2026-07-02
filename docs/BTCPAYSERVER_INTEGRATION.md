# BTCPay Server Integration

This document covers every part of the Bitcoin payment flow, from creating an
invoice at checkout through to the webhook that confirms payment and triggers
order fulfilment.

---

## Why BTCPay Server

BTCPay Server is a self-hosted, open-source Bitcoin payment processor. Unlike
Coinbase Commerce, which is restricted to US merchants, BTCPay Server works
globally and has no geographic restrictions, no custodial risk, and no
third-party fees beyond the Bitcoin network transaction fee itself.

---

## Environment Variables

Add the following four variables to `.env.local`:

| Variable | Description |
|---|---|
| `BTCPAY_HOST` | Full URL of your BTCPay Server instance — e.g. `https://btcpay.yourdomain.com`. No trailing slash. |
| `BTCPAY_API_KEY` | API key generated in BTCPay Server. Must have the `btcpay.store.invoices.create` permission. |
| `BTCPAY_STORE_ID` | The Store ID shown in **Store Settings → General**. |
| `BTCPAY_WEBHOOK_SECRET` | The secret generated when you create a webhook in **Store Settings → Webhooks**. |

---

## Files

| File | Role |
|---|---|
| [`lib/payments/btcpayserver.js`](../lib/payments/btcpayserver.js) | API client — creates invoices via the Greenfield v1 REST API. |
| [`lib/payments/verifyBtcpayWebhook.js`](../lib/payments/verifyBtcpayWebhook.js) | Verifies the `BTCPay-Sig` HMAC-SHA256 header on incoming webhooks. |
| [`app/api/webhooks/btcpayserver/route.js`](../app/api/webhooks/btcpayserver/route.js) | Webhook handler — receives BTCPay events and updates order state. |

---

## Checkout Flow

### 1. Customer selects Bitcoin at checkout

The checkout page (`app/(shop)/checkout/page.jsx`) presents four payment
method buttons: **Card**, **SEPA**, **Revolut**, and **Bitcoin**. Selecting
Bitcoin sets `paymentMethod = "bitcoin"` in the POST body sent to
`POST /api/checkout`.

### 2. Server creates a BTCPay invoice

`app/api/checkout/route.js` handles all payment methods. For Bitcoin it calls
`createBtcpayInvoice`:

```js
// app/api/checkout/route.js
import { createBtcpayInvoice } from "@/lib/payments/btcpayserver";

const invoice = await createBtcpayInvoice({
  orderNumber,
  amountCents: finalTotalCents,   // server-computed, never trusted from client
  currency: orderCurrency,        // ISO 4217, e.g. "USD" or "EUR"
  customerEmail: body.customerEmail,
  redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order=${orderNumber}`,
});

order.btcpayInvoiceId = invoice.id;   // persisted to MongoDB
await order.save();
```

`createBtcpayInvoice` sends a `POST` to
`{BTCPAY_HOST}/api/v1/stores/{BTCPAY_STORE_ID}/invoices` and returns
`{ id, checkoutLink }`.

### 3. Browser redirect

The checkout API returns `{ paymentMethod: "bitcoin", hostedUrl, orderNumber }`.
The frontend immediately redirects:

```js
// app/(shop)/checkout/page.jsx
} else if (data.paymentMethod === "bitcoin") {
  clearCart();
  window.location.href = data.hostedUrl;
}
```

The customer completes payment on BTCPay Server's hosted invoice page. After
payment BTCPay redirects back to the `redirectURL` (the success page) with
`redirectAutomatically: true`.

---

## Webhook Handler

### Registration

In your BTCPay Server store, go to **Store Settings → Webhooks → Create Webhook**:

- **Payload URL:** `https://your-domain.com/api/webhooks/btcpayserver`
- **Secret:** copy the generated value into `BTCPAY_WEBHOOK_SECRET`
- **Events to enable:**

  | Event | Purpose |
  |---|---|
  | `InvoiceSettled` | Invoice fully paid — marks order as paid |
  | `InvoiceExpired` | Invoice timed out unpaid — marks order as failed, restores stock |
  | `InvoiceInvalid` | Invoice invalidated — same as expired |
  | `InvoiceReceivedPayment` | Payment detected on-chain, awaiting confirmations |
  | `InvoiceProcessing` | Sufficient confirmations, settlement in progress |

For **local development**, use a tunnelling tool such as [ngrok](https://ngrok.com)
so BTCPay can reach `localhost`:

```bash
ngrok http 3000
# then set the webhook URL to https://<ngrok-id>.ngrok.io/api/webhooks/btcpayserver
```

### Signature Verification

Every incoming webhook is verified before any database work is done:

```js
// app/api/webhooks/btcpayserver/route.js
const rawBody  = await request.text();
const sigHeader = request.headers.get("btcpay-sig"); // "sha256=<hex>"

const valid = verifyBtcpayWebhookSignature(rawBody, sigHeader);
```

`verifyBtcpayWebhookSignature` (in [`lib/payments/verifyBtcpayWebhook.js`](../lib/payments/verifyBtcpayWebhook.js))
computes `HMAC-SHA256(rawBody, BTCPAY_WEBHOOK_SECRET)` and uses
`crypto.timingSafeEqual` for the comparison — preventing timing-based
secret extraction.

### Event Handling

```
InvoiceSettled
  └─ order.paymentStatus  = "paid"
  └─ order.fulfillmentStatus = "processing"
  └─ awardReferralCredit()     (idempotent — skipped if already awarded)
  └─ sendOrderConfirmationEmail()

InvoiceExpired | InvoiceInvalid
  └─ order.paymentStatus  = "failed"   (only if currently "pending")
  └─ stock restored via Product.updateOne $inc for each line item

InvoiceReceivedPayment | InvoiceProcessing
  └─ no-op — order stays "pending" until InvoiceSettled fires
```

All responses return `200 { received: true }` so BTCPay does not retry.

---

## Resuming a Pending Bitcoin Order

If a logged-in customer navigates away before completing payment, they can
resume from their account order page. `GET /api/customer/orders/[orderNumber]/resume`
rebuilds the checkout URL from the stored invoice ID:

```js
// app/api/customer/orders/[orderNumber]/resume/route.js
if (order.btcpayInvoiceId) {
  const host = process.env.BTCPAY_HOST?.replace(/\/$/, "");
  return NextResponse.json({
    paymentMethod: "bitcoin",
    hostedUrl: `${host}/i/${order.btcpayInvoiceId}`,
    orderNumber: order.orderNumber,
  });
}
```

---

## Order Schema Fields

The `Order` Mongoose document stores one BTCPay-specific field:

| Field | Type | Description |
|---|---|---|
| `btcpayInvoiceId` | `String` | BTCPay invoice ID (e.g. `"2TnUCKXyzABC…"`). Used to match incoming webhook events and to reconstruct the checkout URL. |

No wallet addresses, private keys, or payment secrets are stored.

---

## API Key Permissions

When generating the API key in BTCPay Server (**Account → API keys → Generate key**):

- Enable **`btcpay.store.invoices.create`** — required for `createBtcpayInvoice`.
- No other permissions are needed by the application server.

Webhook delivery does not use the API key; it is authenticated purely via
the `BTCPay-Sig` header and the shared `BTCPAY_WEBHOOK_SECRET`.

---

## Self-Hosting vs. Third-Party Hosts

You do not have to run your own server. Several third-party hosts offer managed
BTCPay Server instances:

- [LunaNode](https://www.lunanode.com/) — one-click BTCPay Server deployment
- [Voltage.cloud](https://voltage.cloud/) — managed Lightning + BTCPay
- [BTCPay Server directory](https://directory.btcpayserver.org/) — community hosts

Point `BTCPAY_HOST` at whichever instance you use.
