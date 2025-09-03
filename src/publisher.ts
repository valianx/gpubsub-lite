/**
 * @acme/pubsubx - Publisher Wrapper
 */

import type { PubSub, Topic } from '@google-cloud/pubsub';
import type { PublisherOptions } from './types.js';

/**
 * Publisher wrapper that provides JSON serialization and attribute handling
 * 
 * @example
 * ```typescript
 * const publisher = createPublisher(client, 'my-topic', {
 *   attributesDefaults: { source: 'my-service' },
 *   orderingKeySelector: (data) => data.userId
 * });
 * 
 * await publisher.publish({ message: 'Hello World!' });
 * ```
 */
export interface Publisher {
  /** Publish a message with JSON serialization */
  publish(data: unknown, attributes?: Record<string, string>): Promise<string>;
  /** Get the underlying Topic instance */
  getTopic(): Topic;
}

/**
 * Create a publisher for the specified topic
 */
export function createPublisher(
  client: PubSub,
  topicName: string,
  options: PublisherOptions = {}
): Publisher {
  const { 
    attributesDefaults = {}, 
    orderingKeySelector,
    ...topicOptions 
  } = options;
  
  // Create topic with SDK-compatible options
  const topic = client.topic(topicName, topicOptions);

  return {
    async publish(data: unknown, attributes: Record<string, string> = {}): Promise<string> {
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

      return messageId;
    },

    getTopic(): Topic {
      return topic;
    },
  };
}
