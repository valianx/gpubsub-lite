# @acme/pubsubx Development Guide (Open Source)

## Code Quality Principles

**TOP PRIORITY: CODE QUALITY**
- **Quality First:** Always prioritize code quality over speed of delivery
- **Clean Code:** Write code that is readable, maintainable, and self-documenting
- **Test-Driven Development:** Tests are mandatory, not optional - minimum 80% coverage
- **SOLID Principles:** Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **Code Review:** All code must be reviewable and follow established patterns
- **Documentation:** Code should be self-explanatory with meaningful variable names and clear method signatures
- **Error Handling:** Proper exception handling with meaningful error messages
- **Security:** Input validation, proper authentication, and secure coding practices
- **Performance:** Efficient algorithms and proper resource management

## Project Architecture

This is an **open source** TypeScript npm library for Google Cloud Pub/Sub with a focus on **simplicity** and **idempotency**. The library is framework-agnostic but includes NestJS integration examples.

### Core Components

- **Client**: `createPubSubClient()` - Wraps `@google-cloud/pubsub` with credential management
- **Publisher**: `createPublisher()` - JSON serialization with exponential backoff + jitter retry logic
- **Consumer**: `createConsumer()` - Message handling with optional Redis-backed idempotency
- **Idempotency Store**: Redis-based deduplication with configurable TTL (default: 6h)

### Key Design Patterns

```
src/
├── client.ts          # PubSub client factory
├── publisher.ts       # Publisher with retry logic  
├── consumer.ts        # Consumer with idempotency hooks
├── idempotency/       # Redis store implementation
├── schemas/           # Validation (JSON/Avro/Proto support)
└── types.ts           # Public interfaces
```

### Official GCP Pub/Sub Client Patterns

Follow these patterns from `@google-cloud/pubsub`:
- Use `topic.publishMessage({ data: Buffer.from(JSON.stringify(obj)) })` for publishing
- Enable message ordering with `{ orderingKey: string }` for ordered messages
- Configure flow control: `{ maxBytes: 1024 * 1024, maxMessages: 100 }`
- Handle schema validation with `{ schema: schemaName, encoding: 'JSON'|'BINARY' }`

## Critical Development Workflows

### Build System
- **tsup**: Dual ESM/CJS output with TypeScript declarations
- **Commands**: `npm run build` (production), `npm run dev` (watch mode)
- **Target**: Node 18+ LTS

### Testing Strategy (Vitest)
- Mock `@google-cloud/pubsub` Publisher and Message objects
- Test retry behavior with simulated failures
- Idempotency tests using in-memory Redis simulation
- Schema validation success/failure scenarios

### Official GCP Testing Patterns
```ts
// Mock topic.publishMessage for retry testing
const mockTopic = { 
  publishMessage: vi.fn()
    .mockRejectedValueOnce(new Error('transient'))
    .mockResolvedValue('msg-id-1') 
};

// Mock subscription.on('message') for consumer testing  
const mockSubOn = vi.fn((event: string, cb: any) => {
  cb(fakeMessage('m1', { data: 'test' }, { eventId: 'e-1' }));
});
```

### Retry Logic Implementation
```ts
// Exponential backoff + jitter formula
delay = min(maxRetryDelayMs, retryDelayMs * (2 ** attempt)) + random(0..retryDelayMs)
```

## Project-Specific Conventions

### Authentication Patterns (GCP Standards)
1. **Application Default Credentials (ADC)** - Primary method (RECOMMENDED for GKE)
   ```ts
   // Client library automatically discovers credentials via ADC
   // Works seamlessly in GKE with Workload Identity or node SA
   const pubsub = new PubSub({ projectId });
   ```
2. **Service Account Keys** - Fallback for explicit credentials
   ```ts
   const pubsub = new PubSub({
     projectId,
     credentials: JSON.parse(process.env.GCP_SA_JSON)
   });
   ```
3. **Environment Variables**: `GOOGLE_APPLICATION_CREDENTIALS` for key file path
4. **GKE Deployment**: ADC works out-of-the-box with Workload Identity or node Service Accounts

### Publisher Retry Configuration
Based on GCP client library patterns:
```ts
const pubsub = new PubSub({
  retry: {
    initialDelayMs: 100,    // Start delay
    maxDelayMs: 10000,      // Max delay cap
    factor: 2,              // Exponential backoff multiplier
    maxAttempts: 5          // Total retry attempts
  }
});
```

### Consumer Flow Control (GCP Best Practices)
```ts
subscription.flowControl = {
  maxBytes: 10 * 1024 * 1024,  // 10 MB
  maxMessages: 100,            // Message count limit
};
```

### Idempotency Key Selection
- Default: `message.id`
- Custom: `idempotencyKeySelector: (msg) => msg.attributes?.eventId`
- Redis key pattern: `"gpubsub:idemp:" + key`

### Error Handling Hooks
- `onPublishRetry` for publisher retry observation
- `onError`, `onMessageStart`, `onMessageEnd` for consumer lifecycle
- Structured error context: `{ phase: 'pull'|'handle'|'ack'|'nack', messageId? }`

### Redis Integration
- Support both `ioredis` and `node-redis` clients
- Auto-cleanup of internal Redis connections on `consumer.stop()`
- TTL recommendations: 6-12h (short flows), 24-48h (late retries/DLQ)

## Framework Integration

### NestJS Pattern
```ts
@Module({})
export class PubSubModule implements OnModuleInit, OnModuleDestroy {
  private consumer: Consumer;
  
  async onModuleInit() {
    this.consumer = createConsumer(client, {
      idempotencyEnabled: true,
      redis: { url: process.env.REDIS_URL }
    });
  }
  
  async onModuleDestroy() {
    await this.consumer?.stop?.();
  }
}
```

## Testing Patterns

### Publisher Tests
- Verify JSON serialization and attribute passing
- Test exponential backoff timing with mock delays
- Validate schema rejection prevents publish attempts

### Consumer Tests  
- Simulate message ack/nack flows
- Test idempotency store integration with duplicate messages
- Verify TTL expiration and custom key selectors

### Mock Strategy
```ts
const mockTopic = { 
  publishMessage: vi.fn()
    .mockRejectedValueOnce(new Error('transient'))
    .mockResolvedValue('msg-id-1') 
};
```

## Build & Dependencies

- **Runtime**: `@google-cloud/pubsub` (required)
- **Peer**: `ioredis` OR `redis` (for idempotency)
- **Dev**: `vitest`, `tsup`, ESLint, Prettier
- **Output**: ESM + CJS with TypeScript declarations

## Open Source Standards

### **License & Legal**
- **MIT License** for maximum compatibility
- **Package provenance** for npm supply chain security
- **CLA** not required (MIT covers contributions)

### **Community Guidelines**
- **Code of Conduct**: Contributor Covenant 2.1
- **Contributing Guidelines**: Detailed setup, testing, and PR process
- **Issue Templates**: Bug reports, feature requests, questions
- **Security Policy**: Responsible disclosure process

### **Release Management**
- **Semantic Versioning**: Automated with conventional commits
- **Automated Releases**: GitHub Actions + semantic-release
- **Changelog**: Auto-generated from commit messages
- **npm Publishing**: Automated with provenance

### **Quality Assurance**
- **Multi-Node Testing**: Node 18, 20, 22 LTS versions
- **Security Scanning**: CodeQL, Dependabot, npm audit
- **Coverage Requirements**: >90% test coverage
- **Documentation**: 100% public API documented
