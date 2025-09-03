# Dead Letter Queue (DLQ) Example

This example demonstrates how to handle failed messages using Dead Letter Queues with `@valianx/pubsub-lite`. DLQs are essential for building resilient message processing systems that can handle and analyze failed messages.

## Features Demonstrated

- **Dead Letter Queue Setup**: Configuration for message failure handling
- **Retry Policies**: Configurable retry attempts before DLQ routing
- **Error Analysis**: Tools for analyzing and reprocessing failed messages
- **Message Recovery**: Strategies for handling DLQ messages
- **Monitoring**: Observability for DLQ operations

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Publisher  │───▶│ Main Topic   │───▶│  Consumer   │
└─────────────┘    └──────────────┘    └─────────────┘
                           │                   │
                           │            (retry failed)
                           ▼                   │
                  ┌──────────────┐             │
                  │ Retry Topic  │◀────────────┘
                  └──────────────┘
                           │
                    (max retries)
                           ▼
                  ┌──────────────┐
                  │ Dead Letter  │
                  │    Queue     │
                  └──────────────┘
                           │
                           ▼
                  ┌──────────────┐
                  │ DLQ Consumer │
                  │ (Analysis)   │
                  └──────────────┘
```

## Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Create Pub/Sub Resources**:
```bash
# Create topics and subscriptions
gcloud pubsub topics create orders-main
gcloud pubsub topics create orders-retry
gcloud pubsub topics create orders-dlq

# Create main subscription with retry policy
gcloud pubsub subscriptions create orders-main-sub \
  --topic=orders-main \
  --message-retention-duration=7d \
  --retain-acked-messages \
  --max-retry-delay=600s \
  --min-retry-delay=10s \
  --retry-topic=orders-retry

# Create retry subscription
gcloud pubsub subscriptions create orders-retry-sub \
  --topic=orders-retry \
  --max-retry-delay=600s \
  --min-retry-delay=30s \
  --dead-letter-topic=orders-dlq \
  --max-delivery-attempts=5

# Create DLQ subscription
gcloud pubsub subscriptions create orders-dlq-sub \
  --topic=orders-dlq
```

3. **Set Environment Variables**:
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export MAIN_TOPIC="orders-main"
export MAIN_SUBSCRIPTION="orders-main-sub"
export DLQ_TOPIC="orders-dlq"
export DLQ_SUBSCRIPTION="orders-dlq-sub"
```

4. **Run the Example**:
```bash
# Start the main consumer
npm run consumer

# Start the DLQ processor (in another terminal)
npm run dlq-processor

# Publish test messages (in another terminal)
npm run publisher
```

## Files

- `publisher.js` - Publishes test messages including ones that will fail
- `consumer.js` - Main message consumer with intentional failures
- `dlq-processor.js` - Processes and analyzes DLQ messages
- `dlq-analyzer.js` - Tools for analyzing DLQ message patterns
- `message-recovery.js` - Utilities for reprocessing DLQ messages

## Message Flow

1. **Normal Processing**: Messages are processed successfully by the main consumer
2. **Retry Logic**: Failed messages are retried with exponential backoff
3. **DLQ Routing**: Messages that fail all retries are sent to the DLQ
4. **DLQ Analysis**: DLQ processor analyzes failure patterns and reasons
5. **Recovery**: Failed messages can be fixed and republished to the main topic

## Monitoring

The example includes comprehensive logging and metrics:

- Message processing success/failure rates
- Retry attempt counts and reasons
- DLQ message analysis and categorization
- Recovery success rates

## Best Practices

- **Idempotency**: All message processing is idempotent
- **Error Categorization**: Different handling for transient vs permanent errors
- **Alerting**: Monitor DLQ size and failure patterns
- **Recovery Strategy**: Automated and manual recovery processes
