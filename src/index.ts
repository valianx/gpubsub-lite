/**
 * @acme/pubsubx - TypeScript wrapper for Google Cloud Pub/Sub with Redis-backed idempotency
 * 
 * @example
 * ```typescript
 * import { createPubSubClient, createPublisher, createConsumer } from '@acme/pubsubx';
 * 
 * const client = createPubSubClient({ projectId: 'my-project' });
 * const publisher = createPublisher(client, 'my-topic');
 * const consumer = createConsumer(client, 'my-subscription');
 * ```
 */

// Re-export all public APIs
export * from './client.js';
export * from './publisher.js';
export * from './consumer.js';
export * from './types.js';

// Re-export idempotency stores
export * from './idempotency/redis-store.js';
export * from './idempotency/memory-store.js';
