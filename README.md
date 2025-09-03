# @valianx/pubsub-lite

Enhanced TypeScript wrapper for Google Cloud Pub/Sub with Redis-backed idempotency, retry logic, and comprehensive observability.

## 🚀 Quick Start

```bash
# Basic installation
npm install ## 📦 Features

### **Core Features**
- ✅ **Lightweight wrapper** around `@google-cloud/pubsub`
- ✅ **TypeScript** first with full type safety
- ✅ **Framework agnostic** with NestJS integration examples
- ✅ **Production ready** with 51 comprehensive tests

### **🔑 Redis Idempotency**
- ✅ **Exactly-once processing** prevents duplicate handling
- ✅ **Configurable TTL** for idempotency key expiration
- ✅ **Custom key generation** for business-specific deduplication
- ✅ **Redis Cluster support** for high availability
- ✅ **Graceful degradation** when Redis is unavailable

### **💀 Dead Letter Queue (DLQ)**
- ✅ **Automatic failure routing** after max delivery attempts
- ✅ **GCP Pub/Sub native DLQ** support via subscription configuration
- ✅ **Failed message analysis** with DLQ consumer patterns
- ✅ **Recovery workflows** for reprocessing fixed messages
- ✅ **Comprehensive logging** for failure investigation

### **🚀 Enhanced Publisher**
- ✅ **Exponential backoff retry** with configurable parameters
- ✅ **Publisher observability hooks** (onPublishStart, onPublishRetry, onPublishSuccess, etc.)
- ✅ **Message batching** configuration for high-throughput scenarios
- ✅ **Default attributes** for consistent message metadata
- ✅ **Graceful error handling** with isolated hook execution

### **📥 Enhanced Consumer**
- ✅ **Consumer lifecycle hooks** (onMessageReceived, onMessageStart, onMessageSuccess, etc.)
- ✅ **Flow control** for managing message processing rate
- ✅ **Configurable acknowledgment** timeouts and strategies
- ✅ **Error isolation** prevents hook failures from affecting message processing
- ✅ **Comprehensive observability** for production monitoringlite

# With Redis for idempotency (recommended for production)
npm install @valia| Business logic errors | ❌ | ✅ Send to DLQ |

## 🎯 Use Cases & Examples

### E-commerce Order Processing

```typescript
// Order creation with guaranteed delivery
const orderPublisher = createPublisher(client, 'orders', {
  attributesDefaults: { service: 'order-api' },
  retry: { maxAttempts: 3 }
});

// Idempotent order processing
const orderConsumer = createConsumer(client, 'order-processing', async (order) => {
  await validateOrder(order);
  await reserveInventory(order);
  await processPayment(order);
  await createShipment(order);
}, {
  idempotencyEnabled: true,
  redis: { url: process.env.REDIS_URL },
  idempotencyKeyGenerator: (order) => `order:${order.id}:${order.version}`
});
```

### Payment Processing with DLQ

```typescript
// Payment consumer with DLQ for failed payments
const paymentConsumer = createConsumer(client, 'payments', async (payment) => {
  if (!isValidPayment(payment)) {
    throw new Error('Invalid payment data'); // Goes to DLQ immediately
  }
  
  await processPayment(payment); // Retries on transient failures
}, {
  flowControl: { maxMessages: 10 }, // Limit concurrent payments
  ackDeadline: 30000 // 30 second timeout
});

// DLQ consumer for manual review
const paymentDlqConsumer = createConsumer(client, 'payments-dlq', async (payment) => {
  await notifyAdminTeam(payment);
  await logFailureForAudit(payment);
});
```

### Email Notifications with Idempotency

```typescript
const emailConsumer = createConsumer(client, 'email-notifications', async (notification) => {
  await sendEmail(notification.email, notification.template, notification.data);
}, {
  idempotencyEnabled: true,
  redis: { url: process.env.REDIS_URL },
  idempotencyTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  idempotencyKeyGenerator: (notification) => 
    `email:${notification.userId}:${notification.type}:${notification.date}`
});
```

## � Getting Started Guide

### 1. **Basic Setup** (Development)
```bash
npm install @valianx/pubsub-lite
```
Start with basic publisher/consumer without Redis for quick prototyping.

### 2. **Add Redis Idempotency** (Staging)
```bash
npm install ioredis
```
Enable idempotency for duplicate protection in staging environment.

### 3. **Configure DLQ** (Production)
```bash
# Set up DLQ in Google Cloud
gcloud pubsub subscriptions update your-subscription \
  --dead-letter-topic=your-dlq-topic \
  --max-delivery-attempts=5
```

### 4. **Production Checklist**
- ✅ Redis cluster for high availability
- ✅ DLQ monitoring and alerting
- ✅ Proper error handling and logging
- ✅ Flow control configuration
- ✅ Comprehensive testing with examples

### 5. **Explore Examples**
- **Basic**: `examples/basic/` - Simple publisher/consumer
- **NestJS**: `examples/nestjs/` - Framework integration
- **Redis**: `examples/redis-idempotency/` - Production idempotency
- **DLQ**: `examples/dlq/` - Failure handling patterns

## �📖 Documentationpubsub-lite ioredis
```

### Basic Publisher/Consumer

```typescript
import { createPubSubClient, createPublisher, createConsumer } from '@valianx/pubsub-lite';

// Create client
const client = createPubSubClient({
  projectId: 'my-project'
});

// Basic Publisher
const publisher = createPublisher(client, 'my-topic');
await publisher.publish({ message: 'Hello World!' });

// Basic Consumer
const consumer = createConsumer(client, 'my-subscription', async (data, attributes, messageId) => {
  console.log('Received:', data);
  // Process message here
});

await consumer.start();
```

### Production Setup with Redis + DLQ

```typescript
import { createPubSubClient, createPublisher, createConsumer } from '@valianx/pubsub-lite';

// Create client
const client = createPubSubClient({
  projectId: 'my-project'
});

### Production Setup with Redis + DLQ

```typescript
import { createPubSubClient, createPublisher, createConsumer } from '@valianx/pubsub-lite';
import Redis from 'ioredis';

// Create client
const client = createPubSubClient({
  projectId: 'my-project'
});

// Production Publisher with retry logic
const publisher = createPublisher(client, 'orders-topic', {
  attributesDefaults: { source: 'order-service', version: '1.0' },
  retry: {
    maxAttempts: 5,
    initialDelayMs: 100,
    maxDelayMs: 10000
  },
  hooks: {
    onPublishStart: (data) => console.log('Publishing order:', data.orderId),
    onPublishRetry: (error, data, attempt) => console.log(`Retry ${attempt} for order:`, data.orderId),
    onPublishSuccess: (messageId, data) => console.log('Order published:', data.orderId, messageId)
  }
});

// Production Consumer with Redis idempotency
const consumer = createConsumer(client, 'orders-subscription', async (data, attributes, messageId) => {
  try {
    await processOrder(data);
    console.log('Order processed successfully:', data.orderId);
  } catch (error) {
    console.error('Order processing failed:', data.orderId, error);
    throw error; // Will trigger DLQ after max delivery attempts
  }
}, {
  // Enable Redis idempotency
  idempotencyEnabled: true,
  redis: new Redis('redis://localhost:6379'),
  idempotencyTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  
  // Flow control for high throughput
  flowControl: {
    maxMessages: 50,
    maxBytes: 10 * 1024 * 1024 // 10MB
  },
  
  // Comprehensive hooks
  hooks: {
    onMessageReceived: (messageId, data) => console.log('Received order:', data.orderId),
    onIdempotencyCheck: (messageId, key, isDuplicate) => {
      if (isDuplicate) console.log('Duplicate order detected:', key);
    },
    onMessageSuccess: (messageId, data) => console.log('Order completed:', data.orderId),
    onMessageError: (messageId, data, error) => console.error('Order failed:', data.orderId, error.message)
  }
});

await consumer.start();

// DLQ Consumer for failed orders
const dlqConsumer = createConsumer(client, 'orders-dlq-subscription', async (data, attributes, messageId) => {
  console.log('Processing failed order from DLQ:', data.orderId);
  
  // Analyze and potentially recover failed orders
  await analyzeFailedOrder(data, attributes);
});

await dlqConsumer.start();
```
```

## � Requirements

- **Node.js**: >=18.0.0 (recommended: 22.19.0 LTS)
- **npm**: >=8.0.0
- **Google Cloud Project** with Pub/Sub API enabled
- **Redis** (optional, for idempotency features)

## �📦 Features

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

## � Redis Idempotency

Redis-based idempotency ensures exactly-once message processing, preventing duplicates from retries, network issues, or publisher errors.

### Quick Setup

```typescript
import Redis from 'ioredis';

// 1. Install Redis client
npm install ioredis

// 2. Configure consumer with Redis
const consumer = createConsumer(client, 'subscription', handler, {
  idempotencyEnabled: true,
  redis: new Redis('redis://localhost:6379'),
  idempotencyTtlMs: 24 * 60 * 60 * 1000, // 24 hours
  
  // Custom key generator (optional)
  idempotencyKeyGenerator: (data, attributes, messageId) => {
    return `order:${data.orderId}:${data.action}`;
  }
});
```

### Redis Configuration Options

```typescript
// Basic Redis connection
redis: { url: 'redis://localhost:6379' }

// Redis client instance
redis: new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your-password',
  db: 0
})

// Redis Cluster
redis: new Redis.Cluster([
  { host: 'node1', port: 6379 },
  { host: 'node2', port: 6379 },
  { host: 'node3', port: 6379 }
])
```

### When to Use Redis Idempotency

- ✅ **Payment Processing**: Prevent double charges
- ✅ **Order Management**: Avoid duplicate orders
- ✅ **Email Notifications**: Prevent spam from retries
- ✅ **Data Synchronization**: Ensure consistency across systems
- ✅ **High-Traffic Systems**: Handle retry storms gracefully

## 💀 Dead Letter Queue (DLQ)

DLQ handles messages that fail processing after all retry attempts, enabling failure analysis and recovery.

### GCP Pub/Sub DLQ Setup

```bash
# 1. Create main topic and subscription
gcloud pubsub topics create orders-topic
gcloud pubsub subscriptions create orders-subscription \
  --topic=orders-topic

# 2. Create DLQ topic and subscription
gcloud pubsub topics create orders-dlq
gcloud pubsub subscriptions create orders-dlq-subscription \
  --topic=orders-dlq

# 3. Configure main subscription with DLQ
gcloud pubsub subscriptions update orders-subscription \
  --dead-letter-topic=orders-dlq \
  --max-delivery-attempts=5
```

### Consumer Implementation

```typescript
// Main consumer with error handling
const mainConsumer = createConsumer(client, 'orders-subscription', async (data, attributes, messageId) => {
  try {
    await processOrder(data);
  } catch (error) {
    console.error(`Order processing failed: ${messageId}`, error);
    throw error; // This will trigger retry/DLQ after max attempts
  }
}, {
  flowControl: { maxMessages: 10 },
  ackDeadline: 60000, // 60 seconds
});

// DLQ consumer for failed messages
const dlqConsumer = createConsumer(client, 'orders-dlq-subscription', async (data, attributes, messageId) => {
  console.log('Processing failed message from DLQ:', messageId);
  
  // Analyze failure
  await analyzeFailure(data, attributes);
  
  // Optionally republish to main topic after fixing
  if (await canRetryMessage(data)) {
    await publisher.publish(data, attributes);
  }
});
```

### DLQ Best Practices

- ✅ **Set appropriate max delivery attempts** (typically 3-5)
- ✅ **Monitor DLQ size** and set up alerts
- ✅ **Implement DLQ consumers** for failure analysis
- ✅ **Log failure reasons** for debugging
- ✅ **Create recovery processes** for fixable failures

### DLQ vs Retries

| Scenario | Retries | DLQ |
|----------|---------|-----|
| Transient errors (network) | ✅ Use retries | ❌ |
| Invalid data format | ❌ | ✅ Send to DLQ |
| External service down | ✅ Use retries | ⚠️ DLQ after max attempts |
| Business logic errors | ❌ | ✅ Send to DLQ |

## �📖 Documentation

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
