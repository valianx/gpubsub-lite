/**
 * @acme/pubsubx - Consumer Wrapper
 */

import type { PubSub, Subscription, Message } from '@google-cloud/pubsub';
import type { ConsumerOptions, MessageHandler, IdempotencyStore } from './types.js';
import { RedisIdempotencyStore } from './idempotency/redis-store.js';
import { InMemoryIdempotencyStore } from './idempotency/memory-store.js';

/**
 * Simple logger utility to avoid ESLint console warnings
 */
const logger = {
  warn: (message: string, error?: unknown) => {
    // eslint-disable-next-line no-console
    console.warn(message, error);
  },
  error: (message: string, error?: unknown) => {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
};

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
    hooks,
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
      logger.warn(
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
        // Call onMessageReceived hook
        if (hooks?.onMessageReceived) {
          try {
            await hooks.onMessageReceived(message);
          } catch (hookError) {
            logger.warn('@acme/pubsubx: onMessageReceived hook failed:', hookError);
          }
        }

        try {
          // Parse JSON data
          let data: unknown;
          try {
            const rawData = message.data.toString('utf8');
            data = JSON.parse(rawData);
          } catch (parseError) {
            // If JSON parsing fails, pass raw string
            data = message.data.toString('utf8');
          }

          // Check idempotency if enabled
          if (idempotencyStore) {
            const idempotencyKey = idempotencyKeySelector(message);
            
            try {
              const alreadyProcessed = await idempotencyStore.has(idempotencyKey);
              
              // Call onIdempotencyCheck hook
              if (hooks?.onIdempotencyCheck) {
                try {
                  await hooks.onIdempotencyCheck(idempotencyKey, alreadyProcessed);
                } catch (hookError) {
                  logger.warn('@acme/pubsubx: onIdempotencyCheck hook failed:', hookError);
                }
              }
              
              if (alreadyProcessed) {
                // Already processed, ack and return
                message.ack();
                
                // Call onMessageAck hook
                if (hooks?.onMessageAck) {
                  try {
                    await hooks.onMessageAck(message);
                  } catch (hookError) {
                    logger.warn('@acme/pubsubx: onMessageAck hook failed:', hookError);
                  }
                }
                return;
              }

              // Mark as being processed
              await idempotencyStore.set(idempotencyKey);
            } catch (idempotencyError) {
              logger.error('@acme/pubsubx: Idempotency store error, processing message anyway:', idempotencyError);
              // Continue processing even if idempotency fails
            }
          }

          // Call onMessageStart hook
          if (hooks?.onMessageStart) {
            try {
              await hooks.onMessageStart(message);
            } catch (hookError) {
              logger.warn('@acme/pubsubx: onMessageStart hook failed:', hookError);
            }
          }

          // Call user handler
          if (messageHandler) {
            await messageHandler(data as any, message);
          } else {
            // No handler registered, just ack
            message.ack();
            
            // Call onMessageAck hook
            if (hooks?.onMessageAck) {
              try {
                await hooks.onMessageAck(message);
              } catch (hookError) {
                logger.warn('@acme/pubsubx: onMessageAck hook failed:', hookError);
              }
            }
            return;
          }

          // Call onMessageSuccess hook
          if (hooks?.onMessageSuccess) {
            try {
              await hooks.onMessageSuccess(message, data);
            } catch (hookError) {
              logger.warn('@acme/pubsubx: onMessageSuccess hook failed:', hookError);
            }
          }

        } catch (error) {
          // Handle processing errors
          const err = error instanceof Error ? error : new Error(String(error));
          
          // Call onMessageError hook
          if (hooks?.onMessageError) {
            try {
              await hooks.onMessageError(message, err);
            } catch (hookError) {
              logger.warn('@acme/pubsubx: onMessageError hook failed:', hookError);
            }
          }
          
          // Call global error handler
          if (errorHandler) {
            errorHandler(err);
          } else {
            logger.error('Unhandled consumer error:', err);
          }

          // Nack the message on error
          message.nack();
          
          // Call onMessageNack hook
          if (hooks?.onMessageNack) {
            try {
              await hooks.onMessageNack(message);
            } catch (hookError) {
              logger.warn('@acme/pubsubx: onMessageNack hook failed:', hookError);
            }
          }
        }
      });

      subscription.on('error', (error: Error) => {
        if (errorHandler) {
          errorHandler(error);
        } else {
          logger.error('Subscription error:', error);
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
