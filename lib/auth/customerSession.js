import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const CUSTOMER_SESSION_COOKIE = process.env.CUSTOMER_SESSION_COOKIE_NAME || "customer_session";
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Create a customer session token
 */
export function createCustomerSession(customer) {
  const token = jwt.sign(
    {
      customerId: customer._id.toString(),
      email: customer.email,
      type: "customer",
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
    
    return {
      customerId: decoded.customerId,
      email: decoded.email,
    };
  } catch (error) {
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
  } catch (error) {
    return null;
  }
}

// Made with Bob