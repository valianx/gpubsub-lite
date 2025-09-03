/**
 * @acme/pubsubx - Publisher Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPublisher } from '../src/publisher.js';
import type { PubSub, Topic } from '@google-cloud/pubsub';

describe('createPublisher', () => {
  let mockClient: PubSub;
  let mockTopic: Topic;
  let mockPublishMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPublishMessage = vi.fn().mockResolvedValue('message-id-123');
    
    mockTopic = {
      publishMessage: mockPublishMessage,
      name: 'projects/test-project/topics/test-topic',
    } as any;

    mockClient = {
      topic: vi.fn().mockReturnValue(mockTopic),
    } as any;
  });

  describe('Basic Publisher Creation', () => {
    it('should create a publisher with minimal configuration', () => {
      const publisher = createPublisher(mockClient, 'test-topic');

      expect(mockClient.topic).toHaveBeenCalledWith('test-topic', {});
      expect(publisher).toBeDefined();
      expect(typeof publisher.publish).toBe('function');
      expect(typeof publisher.getTopic).toBe('function');
    });

    it('should create a publisher with default attributes', () => {
      const options = {
        attributesDefaults: {
          source: 'test-service',
          version: '1.0',
        },
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);

      expect(mockClient.topic).toHaveBeenCalledWith('test-topic', {});
      expect(publisher).toBeDefined();
    });

    it('should create a publisher with ordering key selector', () => {
      const options = {
        orderingKeySelector: (data: any) => data.userId,
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);

      expect(publisher).toBeDefined();
    });
  });

  describe('Message Publishing', () => {
    it('should publish a simple message', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const data = { message: 'Hello World!' };

      const messageId = await publisher.publish(data);

      expect(messageId).toBe('message-id-123');
      expect(mockPublishMessage).toHaveBeenCalledTimes(1);
      
      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.data).toEqual(Buffer.from(JSON.stringify(data), 'utf8'));
      expect(publishCall.attributes).toEqual({});
    });

    it('should publish a message with custom attributes', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const data = { message: 'Hello World!' };
      const attributes = { customAttr: 'value' };

      const messageId = await publisher.publish(data, attributes);

      expect(messageId).toBe('message-id-123');
      
      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.attributes).toEqual(attributes);
    });

    it('should merge default attributes with custom attributes', async () => {
      const options = {
        attributesDefaults: {
          source: 'test-service',
          version: '1.0',
        },
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);
      const data = { message: 'Hello World!' };
      const attributes = { customAttr: 'value' };

      await publisher.publish(data, attributes);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.attributes).toEqual({
        source: 'test-service',
        version: '1.0',
        customAttr: 'value',
      });
    });

    it('should override default attributes with custom attributes', async () => {
      const options = {
        attributesDefaults: {
          source: 'default-service',
          version: '1.0',
        },
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);
      const data = { message: 'Hello World!' };
      const attributes = { source: 'custom-service' };

      await publisher.publish(data, attributes);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.attributes).toEqual({
        source: 'custom-service', // Custom overrides default
        version: '1.0',
      });
    });
  });

  describe('Ordering Key Support', () => {
    it('should add ordering key when selector is provided', async () => {
      const options = {
        orderingKeySelector: (data: any) => data.userId,
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);
      const data = { message: 'Hello World!', userId: 'user-123' };

      await publisher.publish(data);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.orderingKey).toBe('user-123');
    });

    it('should not add ordering key when selector returns undefined', async () => {
      const options = {
        orderingKeySelector: () => undefined,
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);
      const data = { message: 'Hello World!' };

      await publisher.publish(data);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.orderingKey).toBeUndefined();
    });

    it('should handle ordering key selector throwing error', async () => {
      const options = {
        orderingKeySelector: () => {
          throw new Error('Selector error');
        },
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);
      const data = { message: 'Hello World!' };

      await expect(publisher.publish(data)).rejects.toThrow('Selector error');
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize complex objects to JSON', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const data = {
        id: 123,
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          boolean: true,
        },
        nullValue: null,
      };

      await publisher.publish(data);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      const expectedJson = JSON.stringify(data);
      expect(publishCall.data).toEqual(Buffer.from(expectedJson, 'utf8'));
    });

    it('should handle string data', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const data = 'simple string message';

      await publisher.publish(data);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.data).toEqual(Buffer.from('"simple string message"', 'utf8'));
    });

    it('should handle numeric data', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const data = 42;

      await publisher.publish(data);

      const publishCall = mockPublishMessage.mock.calls[0][0];
      expect(publishCall.data).toEqual(Buffer.from('42', 'utf8'));
    });
  });

  describe('Topic Access', () => {
    it('should provide access to underlying topic', () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      const topic = publisher.getTopic();

      expect(topic).toBe(mockTopic);
    });
  });

  describe('Error Handling', () => {
    it('should propagate publish errors', async () => {
      const error = new Error('Publish failed');
      mockPublishMessage.mockRejectedValue(error);

      const publisher = createPublisher(mockClient, 'test-topic');
      const data = { message: 'Hello World!' };

      await expect(publisher.publish(data)).rejects.toThrow('Publish failed');
    });

    it('should handle JSON serialization errors', async () => {
      const publisher = createPublisher(mockClient, 'test-topic');
      
      // Create circular reference that cannot be serialized
      const data: any = { message: 'Hello World!' };
      data.circular = data;

      await expect(publisher.publish(data)).rejects.toThrow();
    });
  });
});
