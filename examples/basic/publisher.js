/**
 * Basic Publisher Example
 * 
 * This example shows how to publish messages using @valianx/pubsub-lite
 * with basic configuration and error handling.
 */

const { createPubSubClient, createPublisher } = require('@valianx/pubsub-lite');

async function main() {
  try {
    // Get configuration from environment variables
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    const topicName = process.env.PUBSUB_TOPIC || 'my-topic';
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }

    console.log(`🚀 Starting publisher for project: ${projectId}, topic: ${topicName}`);

    // Create PubSub client
    const client = createPubSubClient({
      projectId: projectId
    });

    // Create publisher with basic configuration
    const publisher = createPublisher(client, topicName, {
      // Add default attributes to all messages
      attributesDefaults: {
        source: 'basic-example',
        version: '1.0.0'
      }
    });

    // Publish several test messages
    const messages = [
      { type: 'user.created', userId: '123', email: 'user@example.com' },
      { type: 'order.placed', orderId: '456', amount: 99.99 },
      { type: 'notification.sent', userId: '123', channel: 'email' }
    ];

    console.log(`📤 Publishing ${messages.length} messages...`);

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      try {
        const messageId = await publisher.publish(message, {
          messageIndex: i.toString(),
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Message ${i + 1} published with ID: ${messageId}`);
        console.log(`   Data: ${JSON.stringify(message)}`);
        
        // Wait a bit between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to publish message ${i + 1}:`, error.message);
      }
    }

    // Flush any pending batched messages
    await publisher.flush();
    console.log('🏁 All messages published successfully!');

  } catch (error) {
    console.error('💥 Publisher error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down publisher...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down publisher...');
  process.exit(0);
});

// Run the example
main().catch(console.error);
