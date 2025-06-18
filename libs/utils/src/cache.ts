import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number;

  constructor(ttlInSeconds: number = 180) {
    this.ttl = ttlInSeconds * 1000;

    // Set up periodic cache cleanup
    setInterval(() => this.cleanup(), this.ttl);
  }

  get(key: string): Result<T, void> {
    const entry = this.cache.get(key);
    if (!entry) {
      return err();
    }

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return err();
    }

    return ok(entry.value);
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  // Remove expired entries from cache
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
