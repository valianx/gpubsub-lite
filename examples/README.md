# Examples

This directory contains comprehensive examples demonstrating various features and use cases of `@valianx/pubsub-lite`.

## Available Examples

### 🚀 Basic Usage
**Directory**: `basic/`

Simple publisher and consumer examples showing fundamental usage patterns with proper error handling and graceful shutdown.

**Features**:
- Basic message publishing and consuming
- Error handling and logging
- Environment configuration
- Graceful shutdown patterns

**Run**:
```bash
cd basic/
npm install
npm run publisher  # Terminal 1
npm run consumer   # Terminal 2
```

### 🏗️ NestJS Integration
**Directory**: `nestjs/`

Complete NestJS application demonstrating professional integration patterns with dependency injection, lifecycle management, and health checks.

**Features**:
- NestJS module and service integration
- Dependency injection patterns
- Lifecycle management (startup/shutdown)
- Health check endpoints
- REST API with event publishing
- Background message processing

**Run**:
```bash
cd nestjs/
npm install
npm run start:dev
```

### 💀 Dead Letter Queue (DLQ)
**Directory**: `dlq/`

Advanced example showing how to handle failed messages using Dead Letter Queues with retry policies and message recovery strategies.

**Features**:
- Dead Letter Queue configuration
- Retry policies and exponential backoff
- Failed message analysis and recovery
- Monitoring and alerting patterns
- Message reprocessing utilities

**Run**:
```bash
cd dlq/
npm install
npm run start
```

### 🔑 Redis Idempotency
**Directory**: `redis-idempotency/`

Production-ready example demonstrating Redis-based idempotency to ensure exactly-once message processing.

**Features**:
- Redis integration for idempotency
- Custom idempotency key strategies
- Redis cluster support
- Performance monitoring
- TTL management

**Run**:
```bash
cd redis-idempotency/
docker-compose up -d  # Start Redis
npm install
npm run start
```

## Prerequisites

### Google Cloud Setup
1. **Create a Google Cloud Project**
2. **Enable Pub/Sub API**
3. **Set up authentication** (one of):
   - Application Default Credentials (ADC)
   - Service Account Key
   - Workload Identity (for GKE)

### Required Environment Variables
```bash
# Required for all examples
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Basic example
export PUBSUB_TOPIC="my-topic"
export PUBSUB_SUBSCRIPTION="my-subscription"

# Redis examples
export REDIS_URL="redis://localhost:6379"
```

### Create Pub/Sub Resources
```bash
# Create topic and subscription
gcloud pubsub topics create my-topic
gcloud pubsub subscriptions create my-subscription --topic=my-topic

# For DLQ examples
gcloud pubsub topics create my-dlq-topic
gcloud pubsub subscriptions create my-subscription \
  --topic=my-topic \
  --dead-letter-topic=my-dlq-topic \
  --max-delivery-attempts=5
```

## Running Examples

### Quick Start
Each example directory contains its own `package.json` and can be run independently:

```bash
# Choose an example
cd basic/

# Install dependencies
npm install

# Run the example
npm start
```

### Development Setup
For development across multiple examples:

```bash
# Install all dependencies from root
npm install

# Run specific example
npm run example:basic
npm run example:nestjs
npm run example:dlq
npm run example:redis
```

## Example Structure

Each example follows a consistent structure:

```
example-name/
├── README.md          # Detailed documentation
├── package.json       # Dependencies and scripts
├── .env.example       # Environment template
├── *.js              # Implementation files
└── docker-compose.yml # Supporting services (if needed)
```

## Common Patterns

### Error Handling
All examples demonstrate proper error handling:
- Graceful degradation
- Retry strategies
- Dead letter queues
- Logging and monitoring

### Observability
Examples include comprehensive observability:
- Structured logging
- Performance metrics
- Health checks
- Debugging utilities

### Production Readiness
Examples showcase production-ready patterns:
- Environment configuration
- Security best practices
- Scalability considerations
- Deployment strategies

## Next Steps

1. **Start with `basic/`** to understand core concepts
2. **Try `nestjs/`** for framework integration patterns
3. **Explore `dlq/`** for failure handling strategies
4. **Use `redis-idempotency/`** for exactly-once processing

## Support

For issues or questions:
- Check the main [README](../README.md)
- Review [Architecture](../ARCHITECTURE.md)
- See [API Documentation](../docs/)
