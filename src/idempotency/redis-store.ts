/**
 * @acme/pubsubx - Redis Idempotency Store (production)
 */

import Redis from 'ioredis';
import type { IdempotencyStore, RedisOptions } from '../types.js';

/**
 * Production-ready Redis-backed idempotency store
 * 
 * @example
 * ```typescript
 * const store = new RedisIdempotencyStore({
 *   url: 'redis://localhost:6379',
 *   keyPrefix: 'myapp:idemp:',
 *   ttl: 6 * 60 * 60 * 1000 // 6 hours
 * });
 * ```
 */
export class RedisIdempotencyStore implements IdempotencyStore {
  private redis: Redis;
  private readonly keyPrefix: string;
  private readonly ttl: number;
  private readonly isExternalClient: boolean;

  constructor(options: RedisOptions) {
    this.keyPrefix = options.keyPrefix ?? 'pubsubx:idemp:';
    this.ttl = options.ttl ?? 6 * 60 * 60 * 1000; // 6 hours default

    // Use existing client or create new one
    if (options.client) {
      if (options.client instanceof Redis) {
        this.redis = options.client;
        this.isExternalClient = true;
      } else {
        // Support for node-redis client - wrap with adapter
        this.redis = this.createRedisAdapter();
        this.isExternalClient = true;
      }
    } else {
      // Create new ioredis client
      this.redis = this.createRedisClient(options);
      this.isExternalClient = false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const fullKey = this.keyPrefix + key;
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      // Log error but don't throw - allows fallback behavior
      console.error('Redis idempotency check failed:', error);
      return false;
    }
  }

  async set(key: string, ttl?: number): Promise<void> {
    try {
      const fullKey = this.keyPrefix + key;
      const finalTtl = ttl ?? this.ttl;
      
      // Set key with TTL in milliseconds
      await this.redis.psetex(fullKey, finalTtl, '1');
    } catch (error) {
      // Log error but don't throw - allows graceful degradation
      console.error('Redis idempotency set failed:', error);
    }
  }

  async close(): Promise<void> {
    if (!this.isExternalClient) {
      await this.redis.quit();
    }
  }

  private createRedisClient(options: RedisOptions): Redis {
    if (options.url) {
      return new Redis(options.url);
    }

    // Create config object with proper typing
    const config = {
      host: options.host ?? 'localhost',
      port: options.port ?? 6379,
      db: options.db ?? 0,
      lazyConnect: true,
      ...(options.password && { password: options.password }),
    };

    return new Redis(config);
  }

  private createRedisAdapter(): Redis {
    // For now, throw error if node-redis is used - we'll implement adapter later
    throw new Error(
      'node-redis client adapter not yet implemented. Please use ioredis client or connection options.'
    );
  }
}
