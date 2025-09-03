/**
 * @valianx/pubsub-lite - Enhanced Publisher Wrapper with Retry and Observability
 */

import type { PubSub, Topic } from '@google-cloud/pubsub';
import type { PublisherOptions } from './types.js';

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
 * Calculate exponential backoff delay with jitter
 */
function calculateRetryDelay(
  attempt: number, 
  initialDelayMs: number = 100,
  maxDelayMs: number = 10000,
  factor: number = 2
): number {
  const exponentialDelay = Math.min(maxDelayMs, initialDelayMs * (factor ** attempt));
  const jitter = Math.random() * initialDelayMs;
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced Publisher wrapper with retry logic, batching, and observability hooks
 * 
 * @example
 * ```typescript
 * const publisher = createPublisher(client, 'my-topic', {
 *   attributesDefaults: { source: 'my-service' },
 *   orderingKeySelector: (data) => data.userId,
 *   retry: {
 *     maxAttempts: 5,
 *     initialDelayMs: 100,
 *     maxDelayMs: 10000
 *   },
 *   hooks: {
 *     onPublishStart: (data) => console.log('Publishing:', data),
 *     onPublishRetry: (error, data, attempt) => console.log(`Retry ${attempt}:`, error.message)
 *   }
 * });
 * 
 * await publisher.publish({ message: 'Hello World!' });
 * ```
 */
export interface Publisher {
  /** Publish a message with JSON serialization and retry logic */
  publish(data: unknown, attributes?: Record<string, string>): Promise<string>;
  /** Get the underlying Topic instance for advanced operations */
  getTopic(): Topic;
  /** Flush any pending batched messages */
  flush(): Promise<void>;
}

/**
 * Create an enhanced publisher for the specified topic with retry and observability
 */
export function createPublisher(
  client: PubSub,
  topicName: string,
  options: PublisherOptions = {}
): Publisher {
  const { 
    attributesDefaults = {}, 
    orderingKeySelector,
    retry = {},
    hooks,
    batching
  } = options;

  // Extract retry configuration with defaults
  const {
    initialDelayMs = 100,
    maxDelayMs = 10000,
    factor = 2,
    maxAttempts = 5
  } = retry;

  // Create topic - simple approach for now
  const topic = client.topic(topicName);
  
  // Configure basic batching if specified (using only known properties)
  if (batching) {
    topic.publisher.settings.batching = {
      maxMessages: batching.maxMessages || 100,
      maxBytes: batching.maxBytes || 1024 * 1024
    };
  }

  /**
   * Execute hooks safely without affecting the publish operation
   */
  async function executeHook(
    hookFn: (() => void | Promise<void>) | undefined,
    context: string
  ): Promise<void> {
    if (!hookFn) return;
    
    try {
      await hookFn();
    } catch (hookError) {
      logger.warn(`@valianx/pubsub-lite: Publisher hook '${context}' failed:`, hookError);
    }
  }

  /**
   * Publish with retry logic and hooks
   */
  async function publishWithRetry(
    data: unknown,
    attributes: Record<string, string> = {}
  ): Promise<string> {
    // Call onPublishStart hook
    await executeHook(
      () => hooks?.onPublishStart?.(data, attributes),
      'onPublishStart'
    );

    let lastError: unknown;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Serialize data to JSON
        const jsonData = JSON.stringify(data);
        const dataBuffer = Buffer.from(jsonData, 'utf8');

        // Merge default attributes with provided attributes
        const finalAttributes = { ...attributesDefaults, ...attributes };

        // Generate ordering key if selector provided
        const orderingKey = orderingKeySelector?.(data);
        const publishOptions: Record<string, unknown> = {};
        if (orderingKey) {
          publishOptions.orderingKey = orderingKey;
        }

        // Publish using SDK
        const messageId = await topic.publishMessage({
          data: dataBuffer,
          attributes: finalAttributes,
          ...publishOptions,
        });

        // Call onPublishSuccess hook
        await executeHook(
          () => hooks?.onPublishSuccess?.(messageId, data),
          'onPublishSuccess'
        );

        return messageId;

      } catch (error) {
        lastError = error;

        // Call onPublishError hook
        await executeHook(
          () => hooks?.onPublishError?.(error, data, attempt + 1),
          'onPublishError'
        );

        // If this is the last attempt, break out of the loop
        if (attempt === maxAttempts - 1) {
          break;
        }

        // Calculate retry delay
        const delay = calculateRetryDelay(attempt, initialDelayMs, maxDelayMs, factor);

        // Call onPublishRetry hook
        await executeHook(
          () => hooks?.onPublishRetry?.(error, data, attempt + 1, delay),
          'onPublishRetry'
        );

        // Wait before retrying
        await sleep(delay);
      }
    }

    // All retries exhausted
    await executeHook(
      () => hooks?.onPublishFailure?.(lastError, data, maxAttempts),
      'onPublishFailure'
    );

    // Re-throw the last error
    throw lastError;
  }

  return {
    async publish(data: unknown, attributes: Record<string, string> = {}): Promise<string> {
      return publishWithRetry(data, attributes);
    },

    getTopic(): Topic {
      return topic;
    },

    async flush(): Promise<void> {
      // Flush any pending batched messages
      await topic.flush();
    },
  };
}
