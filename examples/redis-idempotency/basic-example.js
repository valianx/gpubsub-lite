/**
 * Basic Redis Idempotency Example
 * 
 * This example demonstrates basic usage of Redis-based idempotency
 * with @valianx/pubsub-lite to prevent duplicate message processing.
 */

const { createPubSubClient, createConsumer } = require('@valianx/pubsub-lite');
const Redis = require('ioredis');

async function main() {
  try {
    // Configuration
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const subscriptionName = process.env.PUBSUB_SUBSCRIPTION || 'payments-subscription';
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    console.log('🚀 Starting Redis idempotency example...');
    console.log(`   Project: ${projectId}`);
    console.log(`   Subscription: ${subscriptionName}`);
    console.log(`   Redis: ${redisUrl}`);

    // Create PubSub client
    const client = createPubSubClient({ projectId });

    // Create Redis client
    const redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection established');

    // Message processing statistics
    const stats = {
      totalMessages: 0,
      uniqueMessages: 0,
      duplicateMessages: 0,
      processingErrors: 0,
    };

    // Message handler with business logic
    const handleMessage = async (data, attributes, messageId) => {
      stats.totalMessages++;
      
      console.log(`\n📨 Processing message ${messageId}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Payment ID: ${data.paymentId}`);
      console.log(`   Amount: $${data.amount}`);
      
      // Simulate payment processing
      try {
        switch (data.type) {
          case 'payment.created':
            await processPayment(data);
            break;
          case 'payment.updated':
            await updatePayment(data);
            break;
          case 'payment.cancelled':
            await cancelPayment(data);
            break;
          default:
            console.warn(`⚠️ Unknown payment type: ${data.type}`);
        }
        
        stats.uniqueMessages++;
        console.log(`✅ Payment processed successfully: ${data.paymentId}`);
        
      } catch (error) {
        stats.processingErrors++;
        console.error(`❌ Payment processing failed: ${error.message}`);
        throw error; // Re-throw to trigger message nack
      }
    };

    // Create consumer with Redis idempotency
    const consumer = createConsumer(client, subscriptionName, handleMessage, {
      // Flow control
      flowControl: {
        maxMessages: 5,
        maxBytes: 1024 * 1024,
      },
      
      // Enable Redis idempotency
      idempotencyEnabled: true,
      redis: redis,
      idempotencyTtlMs: 24 * 60 * 60 * 1000, // 24 hours
      
      // Custom idempotency key for payments
      idempotencyKeyGenerator: (data, _attributes, _messageId) => {
        // Use payment ID and type for idempotency
        // This ensures the same payment operation is only processed once
        return `payment:${data.paymentId}:${data.type}`;
      },
      
      // Consumer hooks for monitoring
      hooks: {
        onMessageReceived: (messageId, _data, _attributes) => {
          console.log(`📬 Message received: ${messageId}`);
        },
        
        onIdempotencyCheck: (messageId, key, isDuplicate) => {
          if (isDuplicate) {
            stats.duplicateMessages++;
            console.log(`🔄 Duplicate message detected: ${messageId} (key: ${key})`);
          } else {
            console.log(`🆕 New message: ${messageId} (key: ${key})`);
          }
        },
        
        onMessageSuccess: (messageId, _data) => {
          console.log(`✅ Message processed: ${messageId}`);
          printStats();
        },
        
        onMessageError: (messageId, data, error) => {
          console.error(`❌ Message error: ${messageId} - ${error.message}`);
          printStats();
        },
      },
    });

    // Print statistics
    const printStats = () => {
      console.log('\n📊 Processing Statistics:');
      console.log(`   Total messages: ${stats.totalMessages}`);
      console.log(`   Unique messages: ${stats.uniqueMessages}`);
      console.log(`   Duplicate messages: ${stats.duplicateMessages}`);
      console.log(`   Processing errors: ${stats.processingErrors}`);
      
      if (stats.totalMessages > 0) {
        const duplicateRate = ((stats.duplicateMessages / stats.totalMessages) * 100).toFixed(1);
        console.log(`   Duplicate rate: ${duplicateRate}%`);
      }
    };

    // Start the consumer
    await consumer.start();
    console.log('\n🎧 Consumer started with Redis idempotency');
    console.log('   Press Ctrl+C to stop gracefully');

    // Print stats every 30 seconds
    const statsInterval = setInterval(() => {
      if (stats.totalMessages > 0) {
        printStats();
      }
    }, 30000);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down...');
      clearInterval(statsInterval);
      
      if (consumer) {
        await consumer.stop();
        console.log('✅ Consumer stopped');
      }
      
      await redis.quit();
      console.log('✅ Redis disconnected');
      
      printStats();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('💥 Error starting consumer:', error.message);
    process.exit(1);
  }
}

// Simulate payment processing functions
async function processPayment(data) {
  console.log(`   💳 Processing payment: ${data.paymentId}`);
  await simulateWork(500);
  console.log(`   ✅ Payment processed: $${data.amount}`);
}

async function updatePayment(data) {
  console.log(`   📝 Updating payment: ${data.paymentId}`);
  await simulateWork(300);
  console.log(`   ✅ Payment updated: $${data.amount}`);
}

async function cancelPayment(data) {
  console.log(`   ❌ Cancelling payment: ${data.paymentId}`);
  await simulateWork(200);
  console.log(`   ✅ Payment cancelled: $${data.amount}`);
}

async function simulateWork(delayMs) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

// Run the example
main().catch(console.error);
