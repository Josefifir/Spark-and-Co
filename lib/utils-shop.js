import crypto from "crypto";

export function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `LX-${datePart}-${randPart}`;
}

export function formatPrice(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DISCOUNT_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateDiscountCode(length = 8) {
  // Use cryptographically secure random bytes so gift card codes are not
  // predictable by an attacker who observes enough Math.random() output.
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += DISCOUNT_CODE_CHARS[bytes[i] % DISCOUNT_CODE_CHARS.length];
  }
  return code;
}
