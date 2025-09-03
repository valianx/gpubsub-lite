/**
 * @acme/pubsubx - Consumer Wrapper
 */

import type { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import type { ConsumerOptions, MessageHandler, IdempotencyStore } from './types.js';
import { RedisIdempotencyStore } from './idempotency/redis-store.js';
import { InMemoryIdempotencyStore } from './idempotency/memory-store.js';

/**
 * Consumer wrapper that provides idempotency and simplified message handling
 * 
 * @example
 * ```typescript
 * const consumer = createConsumer(client, 'my-subscription', {
 *   idempotencyEnabled: true,
 *   redis: { url: 'redis://localhost:6379' }
 * });
 * 
 * consumer.on('message', async (data, message) => {
 *   console.log('Processing:', data);
 *   message.ack();
 * });
 * ```
 */
export interface Consumer {
  /** Register message handler */
  on(event: 'message', handler: MessageHandler): void;
  /** Register error handler */
  on(event: 'error', handler: (error: Error) => void): void;
  /** Start consuming messages */
  start(): void;
  /** Stop consuming and cleanup resources */
  stop(): Promise<void>;
  /** Get the underlying Subscription instance */
  getSubscription(): Subscription;
}

/**
 * Create a consumer for the specified subscription
 */
export function createConsumer(
  client: PubSub,
  subscriptionName: string,
  options: ConsumerOptions = {}
): Consumer {
  const {
    idempotencyEnabled = false,
    redis,
    idempotencyStore: providedStore,
    idempotencyKeySelector = (message: Message) => message.id,
    hooks: _unused_hooks, // TODO: Implement in v2.0
    ...otherOptions
  } = options;

  // Only pass through options that are compatible with the SDK
  // Filter out our custom options
  const subscriptionOptions = Object.fromEntries(
    Object.entries(otherOptions).filter(([key]) => 
      !['idempotencyEnabled', 'redis', 'idempotencyStore', 'idempotencyKeySelector', 'hooks'].includes(key)
    )
  );

  // Create subscription with SDK-compatible options only
  const subscription = client.subscription(subscriptionName, subscriptionOptions);
  
  // Initialize idempotency store if enabled
  let idempotencyStore: IdempotencyStore | undefined;
  if (idempotencyEnabled) {
    if (providedStore) {
      idempotencyStore = providedStore;
    } else if (redis) {
      idempotencyStore = new RedisIdempotencyStore(redis);
    } else {
      // Fallback to in-memory store with warning
      console.warn(
        '@acme/pubsubx: No Redis config provided for idempotency. Using InMemoryStore (not recommended for production).'
      );
      idempotencyStore = new InMemoryIdempotencyStore();
    }
  }

  let messageHandler: MessageHandler | undefined;
  let errorHandler: ((error: Error) => void) | undefined;
  let isStarted = false;

  const consumer: Consumer = {
    on(event: string, handler: unknown): void {
      if (event === 'message') {
        messageHandler = handler as MessageHandler;
      } else if (event === 'error') {
        errorHandler = handler as (error: Error) => void;
      }
    },

    start(): void {
      if (isStarted) return;
      isStarted = true;

      subscription.on('message', async (message: Message) => {
        try {
          // Parse JSON data
          const rawData = message.data.toString('utf8');
          const data = JSON.parse(rawData);

          // Check idempotency if enabled
          if (idempotencyStore) {
            const idempotencyKey = idempotencyKeySelector(message);
            const alreadyProcessed = await idempotencyStore.has(idempotencyKey);
            
            if (alreadyProcessed) {
              // Already processed, ack and return
              message.ack();
              return;
            }

            // Mark as being processed
            await idempotencyStore.set(idempotencyKey);
          }

          // Call user handler
          if (messageHandler) {
            await messageHandler(data, message);
          } else {
            // No handler registered, just ack
            message.ack();
          }
        } catch (error) {
          // Handle errors
          const err = error instanceof Error ? error : new Error(String(error));
          
          if (errorHandler) {
            errorHandler(err);
          } else {
            console.error('Unhandled consumer error:', err);
          }

          // Nack the message on error
          message.nack();
        }
      });

      subscription.on('error', (error: Error) => {
        if (errorHandler) {
          errorHandler(error);
        } else {
          console.error('Subscription error:', error);
        }
      });
    },

    async stop(): Promise<void> {
      if (!isStarted) return;
      isStarted = false;

      // Close subscription
      await subscription.close();

      // Close idempotency store
      if (idempotencyStore) {
        await idempotencyStore.close();
      }
    },

    getSubscription(): Subscription {
      return subscription;
    },
  };

  return consumer;
}
