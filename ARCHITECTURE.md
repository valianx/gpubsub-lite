# @acme/pubsubx - Architecture Diagram

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            @acme/pubsubx Library                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐ │
│  │   createClient  │    │  createPublisher │    │    createConsumer       │ │
│  │                 │    │                  │    │                         │ │
│  │ • ADC auth      │───▶│ • JSON serialize │───▶│ • Message handling      │ │
│  │ • Credentials   │    │ • SDK retry      │    │ • Idempotency check     │ │
│  │ • Project ID    │    │ • Attributes     │    │ • Flow control          │ │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Google Cloud Pub/Sub SDK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐ │
│  │     Client      │    │      Topic       │    │     Subscription        │ │
│  │                 │    │                  │    │                         │ │
│  │ • Auth handling │───▶│ • publishMessage │───▶│ • message.on('data')    │ │
│  │ • Connection    │    │ • Retry logic    │    │ • Flow control          │ │
│  │ • Config        │    │ • Ordering       │    │ • Ack/Nack              │ │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
```

## 🔄 Message Flow with Redis Idempotency

```
                        PUBLISHER FLOW
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │───▶│  @acme/pubsubx   │───▶│   Pub/Sub Topic │
│                 │    │                  │    │                 │
│ publish(data)   │    │ • JSON.stringify │    │ • SDK retry     │
│                 │    │ • Add attributes │    │ • Ordering      │
└─────────────────┘    └──────────────────┘    └─────────────────┘

                        CONSUMER FLOW with IDEMPOTENCY
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌──────────────┐
│ Pub/Sub Topic   │───▶│  Subscription    │───▶│ @acme/pubsubx   │───▶│ Application  │
│                 │    │                  │    │                 │    │              │
│ • Messages      │    │ • Pull messages  │    │ 1. Check Redis  │    │ handleMsg()  │
│ • Ordering      │    │ • Flow control   │    │ 2. Execute?     │    │              │
└─────────────────┘    └──────────────────┘    │ 3. Mark in Redis│    │              │
                                               │ 4. Ack/Nack     │    │              │
                                               └─────────────────┘    └──────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │ Redis Store     │
                                               │                 │
                                               │ • Idempotency   │
                                               │ • TTL (6h)      │
                                               │ • Key pattern   │
                                               └─────────────────┘
```

## ⚠️ Dead Letter Queue (DLQ) Flow

```
                        NORMAL MESSAGE PROCESSING
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Subscription  │───▶│   Consumer       │───▶│   Success       │
│                 │    │                  │    │                 │
│ • message       │    │ • Process        │    │ • message.ack() │
└─────────────────┘    └──────────────────┘    └─────────────────┘

                        FAILURE WITH RETRY
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Subscription  │───▶│   Consumer       │───▶│   Failure       │
│                 │    │                  │    │                 │
│ • message       │    │ • Process fails  │    │ • message.nack()│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                        ┌─────────────────────────────────────────┐
                        │           SDK RETRY LOGIC               │
                        │                                         │
                        │ • Exponential backoff                  │
                        │ • maxDeliveryAttempts = 5               │
                        │ • Automatic retry handling              │
                        └─────────────────────────────────────────┘
                                                         │
                                                         ▼ (after max attempts)
                        ┌─────────────────────────────────────────┐
                        │         DEAD LETTER QUEUE               │
                        │                                         │
                        │ • Failed messages                       │
                        │ • Manual inspection                     │
                        │ • Replay capability                     │
                        └─────────────────────────────────────────┘
```

## 🧩 Component Interactions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WRAPPER PATTERN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  createPubSubClient()                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     new PubSub(options)                             │   │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │   │
│  │ │      Auth       │ │   Connection    │ │      Configuration      │ │   │
│  │ │                 │ │                 │ │                         │ │   │
│  │ │ • ADC           │ │ • Endpoints     │ │ • Project ID            │ │   │
│  │ │ • Service Key   │ │ • SSL/TLS       │ │ • Retry settings        │ │   │
│  │ │ • Workload ID   │ │ • Keep-alive    │ │ • Flow control          │ │   │
│  │ └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  createPublisher(topic, options)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    topic.publishMessage()                           │   │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │   │
│  │ │  Serialization  │ │     Retry       │ │      Attributes         │ │   │
│  │ │                 │ │                 │ │                         │ │   │
│  │ │ • JSON.stringify│ │ • Exponential   │ │ • Custom headers        │ │   │
│  │ │ • Buffer.from   │ │ • Jitter        │ │ • Ordering keys         │ │   │
│  │ │ • Validation    │ │ • Max attempts  │ │ • Timestamps            │ │   │
│  │ └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  createConsumer(subscription, options)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                subscription.on('message', handler)                   │   │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐ │   │
│  │ │  Idempotency    │ │   Processing    │ │      Flow Control       │ │   │
│  │ │                 │ │                 │ │                         │ │   │
│  │ │ • Redis check   │ │ • User handler  │ │ • maxMessages: 100      │ │   │
│  │ │ • Key selector  │ │ • Error handling│ │ • maxBytes: 10MB        │ │   │
│  │ │ • TTL: 6h       │ │ • Ack/Nack      │ │ • allowExcessMessages   │ │   │
│  │ └─────────────────┘ └─────────────────┘ └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL DEPENDENCIES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Redis Store                                 │   │
│  │                                                                     │   │
│  │  Key Pattern: "pubsubx:idemp:{messageId|eventId}"                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────────┐  │   │
│  │  │    ioredis  │  │ node-redis  │  │     Memory Store (tests)  │  │   │
│  │  │             │  │             │  │                           │  │   │
│  │  │ • Primary   │  │ • Secondary │  │ • Map<string, timestamp>  │  │   │
│  │  │ • Production│  │ • Fallback  │  │ • setTimeout cleanup      │  │   │
│  │  │ • Clustering│  │ • Community │  │ • Development only        │  │   │
│  │  └─────────────┘  └─────────────┘  └───────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Key Design Decisions

### **1. Wrapper Pattern Benefits**
- ✅ **Minimal overhead**: Pass-through SDK configurations
- ✅ **Production tested**: Leverage Google's battle-tested retry logic
- ✅ **Future-proof**: Automatic updates with SDK improvements
- ✅ **Debugging**: Familiar SDK patterns for troubleshooting

### **2. Redis Idempotency Strategy**
- ✅ **Production-ready**: Persistent storage across restarts
- ✅ **Distributed**: Multiple consumer instances share state
- ✅ **TTL-based**: Automatic cleanup prevents memory bloat
- ✅ **Flexible**: Support both ioredis and node-redis clients

### **3. DLQ Integration**
- ✅ **SDK-native**: Use Pub/Sub's built-in DLQ functionality
- ✅ **Zero config**: Automatic setup with sensible defaults
- ✅ **Monitoring**: Built-in metrics and alerting support
- ✅ **Replay**: Manual or automated message reprocessing
