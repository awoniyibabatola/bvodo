/**
 * Simple in-memory cache for storing hotel images and other data
 * In production, this should be replaced with Redis or similar
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Set a value in cache with optional TTL (default: 24 hours)
   */
  set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from cache if it exists and hasn't expired
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists in cache and hasn't expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new Cache();

// Run cleanup every hour
setInterval(() => {
  cache.cleanup();
}, 60 * 60 * 1000);
