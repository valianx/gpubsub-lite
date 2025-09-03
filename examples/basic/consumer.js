/**
 * Basic Consumer Example
 * 
 * This example shows how to consume messages using @valianx/pubsub-lite
 * with basic configuration and error handling.
 */

const { createPubSubClient, createConsumer } = require('@valianx/pubsub-lite');

async function main() {
  try {
    // Get configuration from environment variables
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const subscriptionName = process.env.PUBSUB_SUBSCRIPTION || 'my-subscription';
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    console.log(`🚀 Starting consumer for project: ${projectId}, subscription: ${subscriptionName}`);

    // Create PubSub client
    const client = createPubSubClient({
      projectId: projectId
    });

    // Message handler function
    const handleMessage = async (data, attributes, messageId) => {
      console.log(`📨 Received message ${messageId}`);
      console.log(`   Data: ${JSON.stringify(data)}`);
      console.log(`   Attributes:`, attributes);
      
      // Simulate message processing
      try {
        // Process different message types
        switch (data.type) {
          case 'user.created':
            console.log(`   👤 Processing user creation for user: ${data.userId}`);
            // Simulate user processing logic
            await new Promise(resolve => setTimeout(resolve, 500));
            break;
            
          case 'order.placed':
            console.log(`   🛒 Processing order placement for order: ${data.orderId}`);
            // Simulate order processing logic
            await new Promise(resolve => setTimeout(resolve, 800));
            break;
            
          case 'notification.sent':
            console.log(`   📧 Processing notification for user: ${data.userId}`);
            // Simulate notification processing logic
            await new Promise(resolve => setTimeout(resolve, 300));
            break;
            
          default:
            console.log(`   ❓ Unknown message type: ${data.type}`);
        }
        
        console.log(`   ✅ Message ${messageId} processed successfully`);
        
      } catch (error) {
        console.error(`   ❌ Error processing message ${messageId}:`, error.message);
        throw error; // Re-throw to trigger message nack
      }
    };

    // Create consumer with basic configuration
    const consumer = createConsumer(client, subscriptionName, handleMessage, {
      // Flow control settings
      flowControl: {
        maxMessages: 10,
        maxBytes: 1024 * 1024 // 1MB
      },
      
      // Acknowledgment settings
      ackDeadline: 60000, // 60 seconds
      
      // Enable idempotency (optional - requires Redis)
      idempotencyEnabled: false
    });

    console.log('🎧 Consumer started. Listening for messages...');
    console.log('   Press Ctrl+C to stop gracefully');

    // Start consuming messages
    await consumer.start();

  } catch (error) {
    console.error('💥 Consumer error:', error.message);
    process.exit(1);
  }
}

// Global consumer reference for graceful shutdown
let globalConsumer = null;

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down consumer...');
  
  if (globalConsumer) {
    try {
      await globalConsumer.stop();
      console.log('✅ Consumer stopped gracefully');
    } catch (error) {
      console.error('❌ Error stopping consumer:', error.message);
    }
  }
  
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Run the example
main()
  .then((consumer) => {
    globalConsumer = consumer;
  })
  .catch(console.error);
