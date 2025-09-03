# @acme/pubsubx

TypeScript wrapper for Google Cloud Pub/Sub with Redis-backed idempotency.

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

// Publish messages
const publisher = createPublisher(client, 'my-topic');
await publisher.publish({ message: 'Hello World!' });

// Consume messages with Redis idempotency
const consumer = createConsumer(client, 'my-subscription', {
  idempotencyEnabled: true,
  redis: { url: 'redis://localhost:6379' }
});

consumer.on('message', async (data, message) => {
  console.log('Received:', data);
  message.ack();
});
```

## 📦 Features

- ✅ **Lightweight wrapper** around `@google-cloud/pubsub`
- ✅ **Redis-backed idempotency** for duplicate message handling
- ✅ **Dead Letter Queue** support via SDK configuration
- ✅ **TypeScript** first with full type safety
- ✅ **Framework agnostic** with NestJS examples
- ✅ **Production ready** with comprehensive testing

## 📖 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Work Plan](./WORK_PLAN.md)
- [Examples](./examples/)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build library
npm run build

# Watch mode
npm run dev
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.
