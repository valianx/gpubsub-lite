/**
 * @acme/pubsubx - Consumer Tests (Simplified)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConsumer } from '../src/consumer.js';
import { InMemoryIdempotencyStore } from '../src/idempotency/memory-store.js';
import type { PubSub, Subscription } from '@google-cloud/pubsub';
import type { IdempotencyStore, ConsumerOptions } from '../src/types.js';

describe('createConsumer', () => {
  let mockClient: PubSub;
  let mockSubscription: Subscription;
  let mockOn: ReturnType<typeof vi.fn>;
  let mockIdempotencyStore: IdempotencyStore;

  beforeEach(() => {
    mockOn = vi.fn();
    
    mockSubscription = {
      on: mockOn,
      close: vi.fn().mockResolvedValue(undefined),
      name: 'projects/test-project/subscriptions/test-subscription',
    } as any;

    mockClient = {
      subscription: vi.fn().mockReturnValue(mockSubscription),
    } as any;

    mockIdempotencyStore = new InMemoryIdempotencyStore();
  });

  describe('Basic Consumer Creation', () => {
    it('should create a consumer with minimal configuration', () => {
      const consumer = createConsumer(mockClient, 'test-subscription');

      expect(mockClient.subscription).toHaveBeenCalledWith('test-subscription', {});
      expect(consumer).toBeDefined();
      expect(typeof consumer.on).toBe('function');
      expect(typeof consumer.start).toBe('function');
      expect(typeof consumer.stop).toBe('function');
      expect(typeof consumer.getSubscription).toBe('function');
    });

    it('should create a consumer with options', () => {
      const options: ConsumerOptions = {
        idempotencyEnabled: true,
        idempotencyStore: mockIdempotencyStore,
      };

      const consumer = createConsumer(mockClient, 'test-subscription', options);

      expect(consumer).toBeDefined();
    });
  });

  describe('Lifecycle Management', () => {
    it('should start message listening', () => {
      const consumer = createConsumer(mockClient, 'test-subscription');

      consumer.start();

      expect(mockOn).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should stop message listening and close subscription', async () => {
      const consumer = createConsumer(mockClient, 'test-subscription');

      consumer.start();
      await consumer.stop();

      expect(mockSubscription.close).toHaveBeenCalled();
    });

    it('should provide access to underlying subscription', () => {
      const consumer = createConsumer(mockClient, 'test-subscription');

      const subscription = consumer.getSubscription();
      expect(subscription).toBe(mockSubscription);
    });
  });

  describe('Message Handler Registration', () => {
    it('should register message handler', () => {
      const consumer = createConsumer(mockClient, 'test-subscription');
      const handler = vi.fn();

      consumer.on('message', handler);
      
      // Test passes if no errors are thrown
      expect(consumer).toBeDefined();
    });

    it('should register error handler', () => {
      const consumer = createConsumer(mockClient, 'test-subscription');
      const handler = vi.fn();

      consumer.on('error', handler);
      
      // Test passes if no errors are thrown  
      expect(consumer).toBeDefined();
    });
  });

  describe('Idempotency Configuration', () => {
    it('should create consumer with idempotency enabled', () => {
      const options: ConsumerOptions = {
        idempotencyEnabled: true,
        idempotencyStore: mockIdempotencyStore,
      };

      const consumer = createConsumer(mockClient, 'test-subscription', options);
      expect(consumer).toBeDefined();
    });

    it('should create consumer with custom idempotency key selector', () => {
      const options: ConsumerOptions = {
        idempotencyEnabled: true,
        idempotencyStore: mockIdempotencyStore,
        idempotencyKeySelector: (msg) => msg.attributes?.eventId || msg.id,
      };

      const consumer = createConsumer(mockClient, 'test-subscription', options);
      expect(consumer).toBeDefined();
    });
  });
});
