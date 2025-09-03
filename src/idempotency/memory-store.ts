/**
 * @valianx/pubsub-lite - In-Memory Idempotency Store (for tests/POC)
 */

import type { IdempotencyStore } from '../types.js';

/**
 * Simple in-memory idempotency store for testing and POC scenarios
 * 
 * @warning This store does not persist across restarts and should not be used in production
 * with multiple consumer instances. Use RedisIdempotencyStore for production.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, number>();
  private cleanupTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly cleanupInterval: number;

  constructor(options: { cleanupInterval?: number } = {}) {
    this.cleanupInterval = options.cleanupInterval ?? 60000; // 1 minute
    this.startCleanup();
  }

  async has(key: string): Promise<boolean> {
    const expiry = this.store.get(key);
    if (expiry === undefined) {
      return false;
    }

    // Check if expired
    if (Date.now() > expiry) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  async set(key: string, ttl: number = 6 * 60 * 60 * 1000): Promise<void> {
    const expiry = Date.now() + ttl;
    this.store.set(key, expiry);
  }

  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.store.clear();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, expiry] of this.store.entries()) {
        if (now > expiry) {
          this.store.delete(key);
        }
      }
    }, this.cleanupInterval);

    // Don't keep the process alive for this timer
    this.cleanupTimer.unref();
  }

  /** Get current store size (for testing) */
  size(): number {
    return this.store.size;
  }
}
