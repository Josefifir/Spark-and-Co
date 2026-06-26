import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set.");
}
const TOKEN_EXPIRY = "30d";

export function generateReviewLink(orderNumber, customerEmail, productId) {
  const token = jwt.sign(
    {
      orderNumber,
      email: customerEmail.toLowerCase(),
      productId,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  return token;
}

export function getReviewLinkUrl(productSlug, token) {
  return `/products/${productSlug}?reviewToken=${token}`;
}
