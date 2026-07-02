# Spark & Co. — Lighter Shop

A full-stack Next.js e-commerce site for selling lighters, with a secured admin
dashboard, MongoDB (NoSQL) storage, and encrypted payments via **Stripe**
(cards, SEPA, Revolut Pay) and **BTCPay Server** (Bitcoin).

## Stack

- **Framework:** Next.js 16 (App Router, Server Components, Route Handlers)
- **Database:** MongoDB via Mongoose, Redis for caching / sessions
- **Payments:** Stripe (cards, SEPA Direct Debit, Revolut Pay) + BTCPay Server (Bitcoin)
- **Auth:** Custom JWT sessions in httpOnly cookies, bcrypt password hashing, TOTP 2FA for admins
- **Styling:** Tailwind CSS v4

## 1. Prerequisites

- Node.js 20+
- A MongoDB instance — easiest options:
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier (recommended, no local install)
  - Or install MongoDB Community Server locally
- A [Stripe](https://dashboard.stripe.com/register) account (test mode is fine to start)
- A [BTCPay Server](https://btcpayserver.org/) instance for Bitcoin payments (self-hosted or via a third-party host)

## 2. Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | Atlas connection string, or `mongodb://localhost:27017/lighter-shop` |
| `JWT_SECRET` | Generate with `openssl rand -base64 32` — **never use the placeholder in production** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for your first admin user (used only by the seed script) |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same publishable key, exposed to the browser |
| `STRIPE_WEBHOOK_SECRET` | Created when you set up the webhook (step 4) |
| `BTCPAY_HOST` | Full URL of your BTCPay Server instance, e.g. `https://btcpay.yourdomain.com` |
| `BTCPAY_API_KEY` | BTCPay Server → Account → API keys → Generate key (grant `btcpay.store.invoices.create`) |
| `BTCPAY_STORE_ID` | BTCPay Server → Store Settings → General (shown at the top) |
| `BTCPAY_WEBHOOK_SECRET` | Generated when you add a webhook in BTCPay Server → Store Settings → Webhooks |

## 3. Seed your database

```bash
npm run seed:admin      # creates your first admin login
npm run seed:products   # adds 6 demo lighters so the store isn't empty
```

## 4. Webhooks (required for orders to actually mark as "paid")

Payments are confirmed via webhooks, not the checkout redirect — this is
intentional and more secure (a user closing their browser early should never
be the only thing that marks an order as paid).

**Stripe**, using the Stripe CLI for local dev:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

**BTCPay Server**: in your store, go to **Store Settings → Webhooks → Create Webhook**.
Set the payload URL to `https://<your-domain>/api/webhooks/btcpayserver` and enable
the `InvoiceSettled`, `InvoiceExpired`, `InvoiceInvalid`, `InvoiceReceivedPayment`,
and `InvoiceProcessing` events. Copy the secret into `BTCPAY_WEBHOOK_SECRET`.
For local development use a tunnelling tool such as `ngrok` so BTCPay can reach your machine.

## 5. Run it

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Security features built in

- **No card data ever touches our server** — Stripe Elements collects card
  details directly in the browser and tokenizes them; our backend only ever
  sees a `PaymentIntent` ID.
- **No private keys stored** — Bitcoin payments redirect to BTCPay Server's
  hosted invoice page; we only store the invoice ID.
- **Webhook signature verification** on both Stripe (`stripe-signature`) and
  BTCPay Server (`BTCPay-Sig`) webhooks, using constant-time HMAC comparison.
- **Server-side price/stock validation** — the checkout API never trusts
  prices sent from the browser; it always re-reads them from MongoDB.
- **Admin auth**: bcrypt-hashed passwords (cost factor 12), JWT sessions in
  httpOnly + SameSite cookies, login rate-limiting, and automatic account
  lockout after 5 failed attempts.
- **Route protection**: `middleware.js` blocks any `/admin/*` page without a
  valid session, and `requireAdmin()` wraps every admin API route.
- **Input validation** with `zod` on every API route that accepts user input.
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy (see `next.config.ts` and `middleware.js`).
- **Generic auth error messages** to avoid leaking which emails have admin
  accounts (user enumeration protection).
- **Rate limiting** on login and checkout endpoints.

## Before you go live — please read

1. **JWT_SECRET**: the app will refuse to build/start in production with the
   placeholder secret. Generate a real one.
2. **Age-restricted product compliance**: lighters are age-restricted (and in
   some places, torch/novelty lighters specifically are restricted or banned)
   in many jurisdictions. The site includes a basic age-gate, but you are
   responsible for confirming:
   - Stripe's acceptable-use / prohibited-business policies permit your
     specific products
   - Any state/national age-verification or shipping requirements (e.g. some
     regions require adult-signature delivery for lighters)
3. **HTTPS in production** is required — cookies are set `secure: true`
   outside development, so the app will not maintain sessions over plain HTTP
   in production.
4. **Switch Stripe to live keys** once you've tested fully in test mode.
   Point `BTCPAY_HOST` at your production BTCPay Server instance.
5. Consider swapping the in-memory rate limiter (`lib/rateLimit.js`) for a
   Redis-backed one if you deploy more than one server instance — the current
   one is per-instance memory and resets on restart.

## Project structure

```
app/
  (shop)/             # storefront - wrapped in AgeGate, Header, Footer, CartProvider
    page.jsx          # homepage
    products/         # listing + detail pages
    cart/             # cart page
    checkout/         # checkout + success pages
  admin/               # admin dashboard - protected by middleware.js
    login/
    dashboard/
    products/
    orders/
  api/
    products/          # public product API
    checkout/          # validates cart, creates order + payment session
    orders/[orderNumber]/  # public order status lookup
    webhooks/
      stripe/          # signature-verified Stripe webhook
      btcpayserver/    # signature-verified BTCPay Server webhook
    admin/              # all protected by requireAdmin()
      login/ logout/ me/
      products/ orders/ stats/
lib/
  db.js                # MongoDB connection (cached across hot reloads)
  models/              # Product, Order, AdminUser (Mongoose schemas)
  auth/                # session signing/verification, requireAdmin wrapper
  payments/            # Stripe + BTCPay Server clients, webhook verification
  rateLimit.js
  utils-shop.js
components/
  ui/                  # Button, Input
  shop/                # Header, Footer, AgeGate, CartContext, ProductCard, etc.
  admin/               # ProductFormModal
scripts/
  seed-admin.js
  seed-products.js
```
