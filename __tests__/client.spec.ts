/**
 * @acme/pubsubx - Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PubSub } from '@google-cloud/pubsub';
import { createPubSubClient } from '../src/client.js';

// Mock the Google Cloud Pub/Sub client
vi.mock('@google-cloud/pubsub', () => ({
  PubSub: vi.fn().mockImplementation((config) => ({
    _config: config,
    topic: vi.fn(),
    subscription: vi.fn(),
  })),
}));

describe('createPubSubClient', () => {
  const MockedPubSub = vi.mocked(PubSub);

  beforeEach(() => {
    MockedPubSub.mockClear();
  });

  describe('Basic Configuration', () => {
    it('should create a PubSub client with minimal configuration', () => {
      const client = createPubSubClient();

      expect(MockedPubSub).toHaveBeenCalledTimes(1);
      expect(MockedPubSub).toHaveBeenCalledWith({});
      expect(client).toBeDefined();
    });

    it('should create a PubSub client with project ID', () => {
      const options = { projectId: 'test-project' };
      const client = createPubSubClient(options);

      expect(MockedPubSub).toHaveBeenCalledWith({
        projectId: 'test-project',
      });
      expect(client).toBeDefined();
    });

    it('should create a PubSub client with all authentication options', () => {
      const options = {
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
        credentials: { client_email: 'test@example.com' },
        apiEndpoint: 'https://custom-endpoint.com',
      };

      const client = createPubSubClient(options);

      expect(MockedPubSub).toHaveBeenCalledWith({
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
        credentials: { client_email: 'test@example.com' },
        apiEndpoint: 'https://custom-endpoint.com',
      });
      expect(client).toBeDefined();
    });
  });

  describe('Option Filtering', () => {
    it('should filter out undefined values', () => {
      const options = {
        projectId: 'test-project',
        keyFilename: undefined,
        credentials: undefined,
        apiEndpoint: undefined,
      };

      createPubSubClient(options);

      expect(MockedPubSub).toHaveBeenCalledWith({
        projectId: 'test-project',
      });
    });

    it('should pass through additional SDK options', () => {
      const options = {
        projectId: 'test-project',
        customOption: 'value',
        anotherOption: { nested: 'value' },
      };

      createPubSubClient(options);

      expect(MockedPubSub).toHaveBeenCalledWith({
        projectId: 'test-project',
        customOption: 'value',
        anotherOption: { nested: 'value' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty options object', () => {
      const client = createPubSubClient({});

      expect(MockedPubSub).toHaveBeenCalledWith({});
      expect(client).toBeDefined();
    });

    it('should handle null-like values gracefully', () => {
      const options = {
        projectId: '',
        keyFilename: null as any,
        credentials: undefined,
      };

      createPubSubClient(options);

      expect(MockedPubSub).toHaveBeenCalledWith({
        projectId: '',
        keyFilename: null, // null values are passed through, only undefined is filtered
      });
    });
  });

  describe('Type Safety', () => {
    it('should accept valid PubSubClientOptions', () => {
      // This test ensures TypeScript compilation works correctly
      const options = {
        projectId: 'test-project',
        keyFilename: '/path/to/key.json',
        credentials: { type: 'service_account' },
        apiEndpoint: 'https://api.example.com',
        customProperty: 'custom-value',
      };

      expect(() => createPubSubClient(options)).not.toThrow();
    });
  });
});
