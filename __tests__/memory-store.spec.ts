/**
 * @acme/pubsubx - InMemoryIdempotencyStore Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryIdempotencyStore } from '../src/idempotency/memory-store.js';

describe('InMemoryIdempotencyStore', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  describe('Basic Operations', () => {
    it('should check if key exists', async () => {
      const hasKey = await store.has('test-key');
      expect(hasKey).toBe(false);
    });

    it('should set and check key', async () => {
      await store.set('test-key');
      const hasKey = await store.has('test-key');
      expect(hasKey).toBe(true);
    });

    it('should handle multiple keys', async () => {
      await store.set('key1');
      await store.set('key2');
      
      expect(await store.has('key1')).toBe(true);
      expect(await store.has('key2')).toBe(true);
      expect(await store.has('key3')).toBe(false);
    });
  });

  describe('TTL Functionality', () => {
    it('should respect TTL', async () => {
      vi.useFakeTimers();
      
      const ttl = 100; // 100ms
      
      await store.set('test-key', ttl);
      expect(await store.has('test-key')).toBe(true);
      
      // Advance time past TTL
      vi.advanceTimersByTime(150);
      expect(await store.has('test-key')).toBe(false);
      
      vi.useRealTimers();
    });

    it('should use default TTL when not specified', async () => {
      await store.set('test-key');
      expect(await store.has('test-key')).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries', async () => {
      vi.useFakeTimers();
      
      const ttl = 100; // 100ms
      
      await store.set('key1', ttl);
      await store.set('key2', ttl);
      
      // Advance time past TTL
      vi.advanceTimersByTime(150);
      
      // Check that expired keys are cleaned up when accessed
      expect(await store.has('key1')).toBe(false);
      expect(await store.has('key2')).toBe(false);
      
      // Add new key
      await store.set('key3');
      expect(await store.has('key3')).toBe(true);
      
      vi.useRealTimers();
    });

    it('should close gracefully', async () => {
      await store.set('test-key');
      await expect(store.close()).resolves.toBeUndefined();
    });
  });
});
