/**
 * @valianx/pubsub-lite - Publisher Tests
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
      flush: vi.fn().mockResolvedValue(undefined),
      name: 'projects/test-project/topics/test-topic',
      publisher: {
        settings: {}
      }
    } as any;

    mockClient = {
      topic: vi.fn().mockReturnValue(mockTopic),
    } as any;
  });

  describe('Basic Publisher Creation', () => {
    it('should create a publisher with minimal configuration', () => {
      const publisher = createPublisher(mockClient, 'test-topic');

      expect(mockClient.topic).toHaveBeenCalledWith('test-topic');
      expect(publisher).toBeDefined();
      expect(typeof publisher.publish).toBe('function');
      expect(typeof publisher.getTopic).toBe('function');
      expect(typeof publisher.flush).toBe('function');
    });

    it('should create a publisher with default attributes', () => {
      const options = {
        attributesDefaults: {
          source: 'test-service',
          version: '1.0',
        },
      };

      const publisher = createPublisher(mockClient, 'test-topic', options);

      expect(mockClient.topic).toHaveBeenCalledWith('test-topic');
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

  describe('Phase 3 Enhancements', () => {
    describe('Retry Logic', () => {
      it('should retry failed publishes with exponential backoff', async () => {
        // Setup mock to fail twice then succeed
        let callCount = 0;
        mockPublishMessage.mockImplementation(() => {
          callCount++;
          if (callCount <= 2) {
            throw new Error('Temporary failure');
          }
          return Promise.resolve('message-id-123');
        });

        const publisher = createPublisher(mockClient, 'test-topic', {
          retry: {
            maxAttempts: 3,
            initialDelayMs: 10, // Small delay for testing
            maxDelayMs: 100
          }
        });

        const data = { message: 'Hello World!' };
        const messageId = await publisher.publish(data);

        expect(messageId).toBe('message-id-123');
        expect(mockPublishMessage).toHaveBeenCalledTimes(3);
      });

      it('should respect maxAttempts and throw after retries exhausted', async () => {
        // Setup mock to always fail
        mockPublishMessage.mockRejectedValue(new Error('Persistent failure'));

        const publisher = createPublisher(mockClient, 'test-topic', {
          retry: {
            maxAttempts: 2,
            initialDelayMs: 10
          }
        });

        const data = { message: 'Hello World!' };
        
        await expect(publisher.publish(data)).rejects.toThrow('Persistent failure');
        expect(mockPublishMessage).toHaveBeenCalledTimes(2);
      });

      it('should work without retry configuration (default behavior)', async () => {
        mockPublishMessage.mockRejectedValue(new Error('Single failure'));

        const publisher = createPublisher(mockClient, 'test-topic');

        await expect(publisher.publish({ message: 'test' })).rejects.toThrow('Single failure');
        expect(mockPublishMessage).toHaveBeenCalledTimes(5); // Default maxAttempts
      });
    });

    describe('Publisher Hooks', () => {
      it('should call onPublishStart and onPublishSuccess hooks', async () => {
        const onPublishStart = vi.fn();
        const onPublishSuccess = vi.fn();

        const publisher = createPublisher(mockClient, 'test-topic', {
          hooks: {
            onPublishStart,
            onPublishSuccess
          }
        });

        const data = { message: 'Hello World!' };
        const messageId = await publisher.publish(data, { attr: 'value' });

        expect(onPublishStart).toHaveBeenCalledWith(data, { attr: 'value' });
        expect(onPublishSuccess).toHaveBeenCalledWith(messageId, data);
      });

      it('should call retry and error hooks on failures', async () => {
        let callCount = 0;
        mockPublishMessage.mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            throw new Error('Temporary failure');
          }
          return Promise.resolve('message-id-123');
        });

        const onPublishError = vi.fn();
        const onPublishRetry = vi.fn();

        const publisher = createPublisher(mockClient, 'test-topic', {
          retry: {
            maxAttempts: 2,
            initialDelayMs: 10
          },
          hooks: {
            onPublishError,
            onPublishRetry
          }
        });

        const data = { message: 'test' };
        await publisher.publish(data);

        expect(onPublishError).toHaveBeenCalledWith(
          expect.any(Error),
          data,
          1
        );
        expect(onPublishRetry).toHaveBeenCalledWith(
          expect.any(Error),
          data,
          1,
          expect.any(Number)
        );
      });

      it('should call onPublishFailure when all retries are exhausted', async () => {
        mockPublishMessage.mockRejectedValue(new Error('Persistent failure'));

        const onPublishFailure = vi.fn();

        const publisher = createPublisher(mockClient, 'test-topic', {
          retry: {
            maxAttempts: 2,
            initialDelayMs: 10
          },
          hooks: {
            onPublishFailure
          }
        });

        const data = { message: 'test' };
        
        await expect(publisher.publish(data)).rejects.toThrow('Persistent failure');
        
        expect(onPublishFailure).toHaveBeenCalledWith(
          expect.any(Error),
          data,
          2
        );
      });

      it('should handle hook errors gracefully without affecting publish', async () => {
        // Spy on console.warn to capture hook error logs
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const faultyHook = vi.fn().mockImplementation(() => {
          throw new Error('Hook failed');
        });

        const publisher = createPublisher(mockClient, 'test-topic', {
          hooks: {
            onPublishStart: faultyHook,
            onPublishSuccess: faultyHook
          }
        });

        const data = { message: 'test' };
        const messageId = await publisher.publish(data);

        expect(messageId).toBe('message-id-123');
        expect(faultyHook).toHaveBeenCalledTimes(2);
        
        // Verify that hook errors were logged
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Publisher hook'),
          expect.any(Error)
        );
        
        // Restore console.warn
        consoleWarnSpy.mockRestore();
      });
    });

    describe('Batching Configuration', () => {
      it('should configure batching settings when provided', () => {
        const publisher = createPublisher(mockClient, 'test-topic', {
          batching: {
            maxMessages: 50,
            maxBytes: 512 * 1024
          }
        });

        expect(mockTopic.publisher.settings.batching).toEqual({
          maxMessages: 50,
          maxBytes: 512 * 1024
        });
      });

      it('should use default batching values when not specified', () => {
        const publisher = createPublisher(mockClient, 'test-topic', {
          batching: {}
        });

        expect(mockTopic.publisher.settings.batching).toEqual({
          maxMessages: 100,
          maxBytes: 1024 * 1024
        });
      });

      it('should not configure batching when not provided', () => {
        const publisher = createPublisher(mockClient, 'test-topic');

        expect(mockTopic.publisher.settings.batching).toBeUndefined();
      });
    });

    describe('Flush Method', () => {
      it('should flush pending messages', async () => {
        const publisher = createPublisher(mockClient, 'test-topic');

        await publisher.flush();

        expect(mockTopic.flush).toHaveBeenCalled();
      });
    });
  });
});
