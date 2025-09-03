# Redis Idempotency Example

This example demonstrates how to use Redis-based idempotency with `@valianx/pubsub-lite` to ensure messages are processed exactly once, even in the face of retries, network issues, or duplicate deliveries.

## Features Demonstrated

- **Redis Idempotency Store**: Using Redis for distributed idempotency tracking
- **Custom Idempotency Keys**: Different strategies for generating unique keys
- **TTL Management**: Configurable time-to-live for idempotency records
- **High Availability**: Redis clustering and failover handling
- **Performance Optimization**: Efficient Redis operations and connection pooling

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Publisher  │───▶│   Pub/Sub    │───▶│  Consumer   │
└─────────────┘    │    Topic     │    └─────────────┘
                   └──────────────┘           │
                                              ▼
                                   ┌─────────────────┐
                                   │ Idempotency     │
                                   │ Check           │
                                   └─────────────────┘
                                              │
                                              ▼
                                   ┌─────────────────┐
                                   │ Redis Store     │
                                   │ - Keys with TTL │
                                   │ - Atomic Ops    │
                                   │ - Clustering    │
                                   └─────────────────┘
```

## Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Start Redis**:
```bash
# Using Docker
docker run --name redis -p 6379:6379 -d redis:7-alpine

# Or using Docker Compose (for clustering)
docker-compose up -d
```

3. **Set Environment Variables**:
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export PUBSUB_TOPIC="payments"
export PUBSUB_SUBSCRIPTION="payments-subscription"
export REDIS_URL="redis://localhost:6379"

# For Redis cluster (optional)
export REDIS_CLUSTER_NODES="redis://node1:6379,redis://node2:6379,redis://node3:6379"
export REDIS_PASSWORD="your-redis-password"
```

4. **Run the Example**:
```bash
# Start the consumer with Redis idempotency
npm run consumer

# Publish duplicate messages to test idempotency
npm run publisher

# Monitor Redis keys and TTL
npm run monitor
```

## Configuration Options

### Basic Redis Configuration
```javascript
const consumer = createConsumer(client, subscription, handler, {
  idempotencyEnabled: true,
  redis: {
    url: 'redis://localhost:6379',
    // Connection options
    connectTimeout: 10000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  },
  idempotencyTtlMs: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Redis Cluster Configuration
```javascript
const consumer = createConsumer(client, subscription, handler, {
  idempotencyEnabled: true,
  redis: {
    cluster: {
      nodes: [
        { host: 'node1', port: 6379 },
        { host: 'node2', port: 6379 },
        { host: 'node3', port: 6379 },
      ],
      options: {
        redisOptions: {
          password: 'your-password',
        },
      },
    },
  },
});
```

### Custom Idempotency Key Strategy
```javascript
const consumer = createConsumer(client, subscription, handler, {
  idempotencyEnabled: true,
  redis: redisConfig,
  // Custom key generation
  idempotencyKeyGenerator: (data, attributes, messageId) => {
    // Use business-specific identifiers
    return `payment:${data.paymentId}:${data.userId}`;
  },
});
```

## Example Scenarios

### Payment Processing
- **Challenge**: Duplicate payment notifications from external systems
- **Solution**: Use payment ID + user ID as idempotency key
- **Benefit**: Prevents double charging customers

### Order Processing
- **Challenge**: Retry storms during high traffic
- **Solution**: Use order ID + timestamp as idempotency key
- **Benefit**: Ensures orders are processed exactly once

### Email Notifications
- **Challenge**: Duplicate email sending on message retries
- **Solution**: Use user ID + notification type + date as key
- **Benefit**: Prevents spam from duplicate notifications

## Files

- `basic-example.js` - Simple Redis idempotency setup
- `payment-processor.js` - Payment processing with idempotency
- `cluster-example.js` - Redis cluster configuration
- `monitoring.js` - Redis monitoring and key analysis
- `performance-test.js` - Load testing with idempotency
- `docker-compose.yml` - Redis cluster setup

## Monitoring

### Key Metrics
- **Hit Rate**: Percentage of duplicate messages detected
- **Miss Rate**: Percentage of new messages processed
- **Redis Performance**: Connection pool, latency, memory usage
- **TTL Distribution**: Key expiration patterns

### Redis Commands for Monitoring
```bash
# Check idempotency keys
redis-cli SCAN 0 MATCH "pubsub:*" COUNT 100

# Monitor key TTL
redis-cli TTL "pubsub:payment:12345:user456"

# Check Redis stats
redis-cli INFO stats

# Monitor real-time operations
redis-cli MONITOR
```

## Best Practices

1. **Key Design**: Use business-meaningful identifiers
2. **TTL Selection**: Balance memory usage vs duplicate protection
3. **Error Handling**: Graceful degradation when Redis is unavailable
4. **Monitoring**: Track idempotency hit rates and Redis health
5. **Clustering**: Use Redis cluster for high availability
6. **Security**: Use Redis AUTH and TLS in production

## Troubleshooting

### Common Issues
- **Redis Connection**: Check network, auth, and firewall settings
- **Memory Usage**: Monitor Redis memory and adjust TTL
- **Key Collisions**: Review idempotency key generation logic
- **Performance**: Use Redis connection pooling and clustering
