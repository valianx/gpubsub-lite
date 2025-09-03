# Basic Publisher/Consumer Example

# Basic Example

This example demonstrates the fundamental usage of `@valianx/pubsub-lite` with a simple publisher and consumer setup. Perfect for getting started and understanding the core concepts.

## Setup

1. **Install dependencies:**
```bash
npm install @valianx/pubsub-lite @google-cloud/pubsub
```

2. **Set up authentication:**
```bash
# Option 1: Use Application Default Credentials (recommended for GKE)
gcloud auth application-default login

# Option 2: Use service account key
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
```

3. **Set environment variables:**
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export PUBSUB_TOPIC="your-topic-name"
export PUBSUB_SUBSCRIPTION="your-subscription-name"
```

## Running the Example

1. **Start the consumer:**
```bash
node consumer.js
```

2. **In another terminal, run the publisher:**
```bash
node publisher.js
```

## What This Example Shows

- **Basic client creation** with automatic authentication
- **Simple message publishing** with JSON serialization
- **Message consumption** with automatic acknowledgment
- **Error handling** basics
- **Graceful shutdown** handling

## Files

- `publisher.js` - Basic message publishing
- `consumer.js` - Basic message consumption
- `package.json` - Dependencies and scripts
- `README.md` - This file
