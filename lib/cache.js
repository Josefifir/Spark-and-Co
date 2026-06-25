/**
 * Redis-based cache utility with fallback to in-memory cache
 * Install: npm install ioredis
 */

let Redis;
try {
  Redis = require('ioredis');
} catch (error) {
  console.warn('ioredis not available, using memory cache only');
  Redis = null;
}

class CacheManager {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.memoryTimers = new Map();
    this.isRedisAvailable = false;

    // Initialize Redis if URL is provided and Redis is available
    if (process.env.REDIS_URL && Redis) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.warn('Redis connection failed, falling back to memory cache');
              this.isRedisAvailable = false;
              return null;
            }
            return Math.min(times * 100, 2000);
          },
        });

        this.redis.on('connect', () => {
          this.isRedisAvailable = true;
          console.log('✅ Redis cache connected');
        });

        this.redis.on('error', (err) => {
          console.warn('Redis error, using memory cache:', err.message);
          this.isRedisAvailable = false;
        });
      } catch (error) {
        console.warn('Failed to initialize Redis, using memory cache:', error.message);
        this.isRedisAvailable = false;
      }
    } else {
      console.log('⚠️  No REDIS_URL found, using in-memory cache (not recommended for production)');
    }
  }

  /**
   * Set a value in cache with optional TTL (time to live in seconds)
   */
  async set(key, value, ttl = 300) {
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.setex(key, ttl, serialized);
        return true;
      } catch (error) {
        console.warn('Redis set failed, falling back to memory:', error.message);
      }
    }

    // Fallback to memory cache
    if (this.memoryTimers.has(key)) {
      clearTimeout(this.memoryTimers.get(key));
    }

    this.memoryCache.set(key, {
      value: serialized,
      expires: Date.now() + (ttl * 1000)
    });

    const timer = setTimeout(() => {
      this.memoryCache.delete(key);
      this.memoryTimers.delete(key);
    }, ttl * 1000);

    this.memoryTimers.set(key, timer);
    return true;
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  async get(key) {
    if (this.isRedisAvailable && this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.warn('Redis get failed, trying memory cache:', error.message);
      }
    }

    // Fallback to memory cache
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.delete(key);
      return null;
    }

    return JSON.parse(item.value);
  }

  /**
   * Delete a key from cache
   */
  async delete(key) {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn('Redis delete failed:', error.message);
      }
    }

    // Also delete from memory cache
    if (this.memoryTimers.has(key)) {
      clearTimeout(this.memoryTimers.get(key));
      this.memoryTimers.delete(key);
    }
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cache (memory only, use with caution for Redis)
   */
  async clear() {
    if (this.isRedisAvailable && this.redis) {
      console.warn('Clear all Redis keys - use with caution in production');
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.warn('Redis clear failed:', error.message);
      }
    }

    for (const timer of this.memoryTimers.values()) {
      clearTimeout(timer);
    }
    this.memoryCache.clear();
    this.memoryTimers.clear();
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Check if key exists
   */
  async has(key) {
    if (this.isRedisAvailable && this.redis) {
      try {
        const exists = await this.redis.exists(key);
        return exists === 1;
      } catch (error) {
        console.warn('Redis exists check failed:', error.message);
      }
    }

    return this.memoryCache.has(key) && Date.now() <= this.memoryCache.get(key).expires;
  }

  /**
   * Invalidate multiple keys by pattern (Redis only)
   */
  async invalidatePattern(pattern) {
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return keys.length;
      } catch (error) {
        console.warn('Redis pattern invalidation failed:', error.message);
      }
    }
    return 0;
  }
}

// Create a global cache instance
const cache = global.appCache || new CacheManager();

if (process.env.NODE_ENV !== 'production') {
  global.appCache = cache;
}

module.exports = cache;
module.exports.default = cache;
module.exports.CacheKeys = CacheKeys;
module.exports.CacheTTL = CacheTTL;

/**
 * Cache key generators for common patterns
 */
const CacheKeys = {
  categories: () => 'categories:all',
  product: (slug) => `product:${slug}`,
  products: (category, page = 1) => `products:${category || 'all'}:${page}`,
  shippingZones: () => 'shipping:zones',
  discountCode: (code) => `discount:${code}`,
  dhlToken: () => 'dhl:token',
};

/**
 * Default TTL values (in seconds)
 */
const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 1800,       // 30 minutes
  VERY_LONG: 3600,  // 1 hour
};

// Made with Bob
