/**
 * Redis-backed rate limiter using ioredis.
 * Survives serverless cold starts and works across multiple instances.
 *
 * Reuses the same Redis connection pattern as lib/auth/session.js.
 */
import IORedis from "ioredis";

let redis;
function getRedis() {
  if (!redis) {
    if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not set.");
    redis = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: 2 });
  }
  return redis;
}

/**
 * Increment a sliding-window counter in Redis.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export async function rateLimit({ key, limit = 5, windowMs = 60_000 }) {
  const redisKey = `rl:${key}`;
  const windowSecs = Math.ceil(windowMs / 1000);

  const client = getRedis();
  // Atomic increment + set TTL only on first write
  const count = await client.incr(redisKey);
  if (count === 1) {
    await client.expire(redisKey, windowSecs);
  }

  if (count > limit) {
    const ttl = await client.ttl(redisKey);
    const retryAfterMs = ttl > 0 ? ttl * 1000 : windowMs;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  return { allowed: true, remaining: limit - count };
}

export function getClientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
