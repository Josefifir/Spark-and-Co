import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("CUSTOMER_JWT_SECRET environment variable is not set.");
}
const CUSTOMER_SESSION_COOKIE = process.env.CUSTOMER_SESSION_COOKIE_NAME || "customer_session";
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Create a customer session token.
 * Embeds tokenVersion so the token can be invalidated server-side
 * (e.g. after a password reset) by bumping the version on the Customer document.
 */
export function createCustomerSession(customer) {
  const token = jwt.sign(
    {
      customerId: customer._id.toString(),
      email: customer.email,
      type: "customer",
      // tokenVersion defaults to 0 if not yet set on the document
      tv: customer.tokenVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: SESSION_DURATION }
  );
  
  return token;
}

/**
 * Set customer session cookie
 */
export async function setCustomerSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * Get customer session from cookie
 */
export async function getCustomerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== "customer") return null;

    // Validate tokenVersion to support session revocation (e.g. after password reset).
    // Lazy-import to avoid circular deps at module load time.
    if (decoded.tv !== undefined) {
      const { dbConnect } = await import("@/lib/db");
      const { default: Customer } = await import("@/lib/models/Customer");
      await dbConnect();
      const customer = await Customer.findById(decoded.customerId).select("tokenVersion").lean();
      const currentVersion = customer?.tokenVersion ?? 0;
      if (decoded.tv !== currentVersion) return null;
    }
    
    return {
      customerId: decoded.customerId,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

/**
 * Clear customer session cookie
 */
export async function clearCustomerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

/**
 * Verify customer session token
 */
export function verifyCustomerToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "customer") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Bump the tokenVersion on a customer document to invalidate all existing JWTs.
 * Call after password reset or explicit "sign out all devices".
 */
export async function revokeCustomerSessions(customerId) {
  const { dbConnect } = await import("@/lib/db");
  const { default: Customer } = await import("@/lib/models/Customer");
  await dbConnect();
  await Customer.updateOne(
    { _id: customerId },
    { $inc: { tokenVersion: 1 } }
  );
}

// Made with Bob