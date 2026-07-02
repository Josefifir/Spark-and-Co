import type { NextConfig } from "next";

// Content-Security-Policy allows Stripe.js/Elements (required for embedded card
// fields) and BTCPay Server's hosted checkout redirect. In development
// we enable 'unsafe-eval' so React's dev tools and error overlays can work.
// Remove 'unsafe-eval' in production for security.
const isDev = process.env.NODE_ENV !== "production";
const btcpayHost = process.env.BTCPAY_HOST ?? "";

const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://storage.googleapis.com"
  : "script-src 'self' 'unsafe-inline' https://*.stripe.com https://storage.googleapis.com";

// In dev allow http: images so localhost-served uploads (and any absolute URLs
// still in the DB) are not blocked. In production only https: is permitted.
const imgSrc = isDev ? "img-src 'self' data: http: https:" : "img-src 'self' data: https:";

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  imgSrc,
  "font-src 'self' data:",
  `connect-src 'self' https://*.stripe.com https://*.stripe.network${btcpayHost ? ` ${btcpayHost}` : ""}`,
  `frame-src 'self' https://*.stripe.com https://*.stripe.network${btcpayHost ? ` ${btcpayHost}` : ""}`,
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "mongoose"],
  // Turbopack configuration for Next.js 16+
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
