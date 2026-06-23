/**
 * Lightweight in-memory rate limiter, keyed by IP (or any string key).
 * Good enough for a single-instance deployment. For multi-instance
 * production deployments, swap this for a Redis-backed limiter.
 */
const buckets = new Map();

export function rateLimit({ key, limit = 5, windowMs = 60_000 }) {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { count: 1, start: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfterMs = windowMs - (now - entry.start);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// Periodically clean up old buckets so memory doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (now - entry.start > 10 * 60_000) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

export function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
