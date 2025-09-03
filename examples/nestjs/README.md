# NestJS Integration Example

This example demonstrates how to integrate `@valianx/pubsub-lite` with a NestJS application, including proper module setup, dependency injection, and lifecycle management.

## Features Demonstrated

- **NestJS Module Integration**: Proper module setup with PubSub client
- **Dependency Injection**: Using PubSub services throughout the application
- **Lifecycle Management**: Graceful startup and shutdown
- **Consumer Service**: Background message processing
- **Publisher Service**: Message publishing with dependency injection
- **Health Checks**: Monitoring PubSub connection status

## Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Set Environment Variables**:
```bash
# Copy and edit the environment file
cp .env.example .env

# Required variables:
export GOOGLE_CLOUD_PROJECT="your-project-id"
export PUBSUB_TOPIC="user-events"
export PUBSUB_SUBSCRIPTION="user-events-subscription"

# Optional (for Redis idempotency):
export REDIS_URL="redis://localhost:6379"
export IDEMPOTENCY_ENABLED="true"
```

3. **Run the Application**:
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start
```

## Architecture

```
src/
├── app.module.ts           # Main application module
├── pubsub/
│   ├── pubsub.module.ts    # PubSub module configuration
│   ├── pubsub.service.ts   # Publisher service
│   └── consumer.service.ts # Consumer service
├── users/
│   ├── users.controller.ts # REST endpoints
│   ├── users.service.ts    # Business logic
│   └── dto/               # Data transfer objects
└── main.ts                # Application bootstrap
```

## API Endpoints

- `POST /users` - Create a user (publishes user.created event)
- `GET /users/:id` - Get user by ID
- `GET /health/pubsub` - Check PubSub connection health

## Message Flow

1. **User Creation**: 
   - REST API creates user
   - Publishes `user.created` event
   - Consumer processes event for email notifications, analytics, etc.

2. **Event Processing**:
   - Consumer receives messages with idempotency checking
   - Processes different event types
   - Handles errors with proper logging

## Configuration

The PubSub module supports various configuration options:

```typescript
// Environment-based configuration
const config = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  topic: process.env.PUBSUB_TOPIC,
  subscription: process.env.PUBSUB_SUBSCRIPTION,
  idempotencyEnabled: process.env.IDEMPOTENCY_ENABLED === 'true',
  redis: {
    url: process.env.REDIS_URL
  }
};
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

This example is ready for deployment to:
- **Google Kubernetes Engine (GKE)** with Workload Identity
- **Cloud Run** with service account authentication
- **Compute Engine** with default service account

See deployment examples in the `../deployment/` directory.
