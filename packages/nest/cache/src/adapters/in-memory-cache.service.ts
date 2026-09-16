import type { CacheService } from "../ports/cache-service.port";

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

export class InMemoryCacheService implements CacheService {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPrefix(prefix: string): Promise<void> {
    const keys = Array.from(this.store.keys()).filter((k) => k.startsWith(prefix));
    keys.forEach((k) => this.store.delete(k));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * Factory function to create an in-memory cache service.
 * Useful for development and testing.
 */
export function createInMemoryCacheService(): CacheService {
  return new InMemoryCacheService();
}
