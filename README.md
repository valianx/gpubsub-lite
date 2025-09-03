# @acme/pubsubx

Enhanced TypeScript wrapper for Google Cloud Pub/Sub with Redis-backed idempotency, retry logic, and comprehensive observability.

## 🚀 Quick Start

```bash
npm install @acme/pubsubx ioredis
```

```typescript
import { createPubSubClient, createPublisher, createConsumer } from '@acme/pubsubx';

// Create client
const client = createPubSubClient({
  projectId: 'my-project'
});

// Enhanced Publisher with retry and hooks
const publisher = createPublisher(client, 'my-topic', {
  attributesDefaults: { source: 'my-service' },
  retry: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000
  },
  hooks: {
    onPublishStart: (data) => console.log('Publishing:', data),
    onPublishRetry: (error, data, attempt) => console.log(`Retry ${attempt}:`, error.message),
    onPublishSuccess: (messageId) => console.log('Published:', messageId)
  }
});

await publisher.publish({ message: 'Hello World!' });

// Enhanced Consumer with comprehensive hooks
const consumer = createConsumer(client, 'my-subscription', {
  idempotencyEnabled: true,
  redis: { url: 'redis://localhost:6379' },
  hooks: {
    onMessageReceived: (message) => console.log('Message received:', message.id),
    onMessageStart: (message) => console.log('Processing:', message.id),
    onMessageSuccess: (message, data) => console.log('Processed:', data),
    onMessageError: (message, error) => console.error('Failed:', error.message)
  }
});

consumer.on('message', async (data, message) => {
  console.log('Received:', data);
  message.ack();
});
```

## 📦 Features

### **Core Features**
- ✅ **Lightweight wrapper** around `@google-cloud/pubsub`
- ✅ **Redis-backed idempotency** for duplicate message handling
- ✅ **Dead Letter Queue** support via SDK configuration
- ✅ **TypeScript** first with full type safety
- ✅ **Framework agnostic** with NestJS examples

### **🆕 Phase 3 Enhancements**
- ✅ **Exponential backoff retry** with configurable parameters
- ✅ **Publisher observability hooks** (onPublishStart, onPublishRetry, onPublishSuccess, etc.)
- ✅ **Consumer lifecycle hooks** (onMessageReceived, onMessageStart, onMessageSuccess, etc.)
- ✅ **Message batching** configuration for high-throughput scenarios
- ✅ **Graceful error handling** with isolated hook execution
- ✅ **Production-ready** with 51 comprehensive tests

## 🔧 Configuration

### Publisher Options

```typescript
const publisher = createPublisher(client, 'topic-name', {
  // Default attributes for all messages
  attributesDefaults: { 
    source: 'my-service',
    version: '1.0'
  },
  
  // Retry configuration
  retry: {
    maxAttempts: 5,         // Maximum retry attempts
    initialDelayMs: 100,    // Initial delay between retries
    maxDelayMs: 10000,      // Maximum delay between retries
    factor: 2               // Exponential backoff multiplier
  },
  
  // Batching configuration for high throughput
  batching: {
    maxMessages: 100,       // Max messages per batch
    maxBytes: 1024 * 1024  // Max batch size in bytes
  },
  
  // Observability hooks
  hooks: {
    onPublishStart: (data, attributes) => { /* ... */ },
    onPublishSuccess: (messageId, data) => { /* ... */ },
    onPublishError: (error, data, attempt) => { /* ... */ },
    onPublishRetry: (error, data, attempt, delay) => { /* ... */ },
    onPublishFailure: (error, data, totalAttempts) => { /* ... */ }
  }
});
```

### Consumer Options

```typescript
const consumer = createConsumer(client, 'subscription-name', {
  // Idempotency configuration
  idempotencyEnabled: true,
  redis: { url: 'redis://localhost:6379' },
  
  // Comprehensive lifecycle hooks
  hooks: {
    onMessageReceived: (message) => { /* ... */ },
    onIdempotencyCheck: (key, alreadyProcessed) => { /* ... */ },
    onMessageStart: (message) => { /* ... */ },
    onMessageSuccess: (message, data) => { /* ... */ },
    onMessageError: (message, error) => { /* ... */ },
    onMessageAck: (message) => { /* ... */ },
    onMessageNack: (message) => { /* ... */ }
  }
});
```

## 📖 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Work Plan](./WORK_PLAN.md)
- [Examples](./examples/)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests (51 tests)
npm test

# Build library
npm run build

# Watch mode
npm run dev
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
