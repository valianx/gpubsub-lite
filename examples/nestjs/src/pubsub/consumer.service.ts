import { Inject, Injectable } from '@nestjs/common';
import { createConsumer, Consumer, PubSubClient } from '@valianx/pubsub-lite';
import { PUBSUB_CLIENT } from './pubsub.module';
import Redis from 'ioredis';

@Injectable()
export class ConsumerService {
  private consumer: Consumer | null = null;
  private redis: Redis | null = null;

  constructor(
    @Inject(PUBSUB_CLIENT) private readonly client: PubSubClient,
  ) {}

  async start(): Promise<void> {
    const subscriptionName = process.env.PUBSUB_SUBSCRIPTION || 'user-events-subscription';
    const idempotencyEnabled = process.env.IDEMPOTENCY_ENABLED === 'true';
    
    // Initialize Redis if idempotency is enabled
    if (idempotencyEnabled) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);
      
      console.log(`🔑 Redis idempotency enabled: ${redisUrl}`);
    }

    // Create consumer with configuration
    this.consumer = createConsumer(
      this.client,
      subscriptionName,
      this.handleMessage.bind(this),
      {
        // Flow control settings
        flowControl: {
          maxMessages: 10,
          maxBytes: 1024 * 1024, // 1MB
        },
        
        // Acknowledgment settings
        ackDeadline: 60000, // 60 seconds
        
        // Idempotency configuration
        idempotencyEnabled,
        redis: this.redis || undefined,
        idempotencyTtlMs: 6 * 60 * 60 * 1000, // 6 hours
        
        // Consumer hooks for observability
        hooks: {
          onMessageReceived: (messageId, data, attributes) => {
            console.log(`📨 Message received:`, {
              messageId,
              type: data?.type,
              attributes,
            });
          },
          
          onIdempotencyCheck: (messageId, key, isDuplicate) => {
            if (isDuplicate) {
              console.log(`🔄 Duplicate message detected:`, { messageId, key });
            }
          },
          
          onMessageStart: (messageId, data) => {
            console.log(`🚀 Processing message:`, {
              messageId,
              type: data?.type,
            });
          },
          
          onMessageSuccess: (messageId, data) => {
            console.log(`✅ Message processed successfully:`, {
              messageId,
              type: data?.type,
            });
          },
          
          onMessageError: (messageId, data, error) => {
            console.error(`❌ Message processing failed:`, {
              messageId,
              type: data?.type,
              error: error.message,
            });
          },
          
          onMessageAck: (messageId) => {
            console.log(`📝 Message acknowledged:`, { messageId });
          },
          
          onMessageNack: (messageId, error) => {
            console.warn(`❌ Message nacked:`, { messageId, error: error?.message });
          },
        },
      },
    );

    // Start consuming messages
    await this.consumer.start();
    console.log(`🎧 Consumer started for subscription: ${subscriptionName}`);
  }

  async stop(): Promise<void> {
    if (this.consumer) {
      await this.consumer.stop();
      this.consumer = null;
    }
    
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /**
   * Message handler that processes different event types
   */
  private async handleMessage(data: any, attributes: Record<string, string>, messageId: string): Promise<void> {
    try {
      // Route message based on event type
      switch (data.type) {
        case 'user.created':
          await this.handleUserCreated(data, attributes, messageId);
          break;
          
        case 'user.updated':
          await this.handleUserUpdated(data, attributes, messageId);
          break;
          
        case 'user.deleted':
          await this.handleUserDeleted(data, attributes, messageId);
          break;
          
        default:
          console.warn(`⚠️ Unknown event type: ${data.type}`, { messageId });
      }
      
    } catch (error) {
      console.error(`💥 Error in message handler:`, {
        messageId,
        type: data?.type,
        error: error.message,
      });
      throw error; // Re-throw to trigger message nack
    }
  }

  private async handleUserCreated(data: any, attributes: Record<string, string>, messageId: string): Promise<void> {
    console.log(`👤 Processing user creation:`, { 
      userId: data.userId, 
      messageId 
    });
    
    // Simulate user creation processing
    // - Send welcome email
    // - Initialize user analytics
    // - Set up default preferences
    
    await this.simulateProcessing(500);
    console.log(`✅ User creation processed: ${data.userId}`);
  }

  private async handleUserUpdated(data: any, attributes: Record<string, string>, messageId: string): Promise<void> {
    console.log(`👤 Processing user update:`, { 
      userId: data.userId, 
      messageId 
    });
    
    // Simulate user update processing
    // - Update search index
    // - Sync with external systems
    // - Update analytics
    
    await this.simulateProcessing(300);
    console.log(`✅ User update processed: ${data.userId}`);
  }

  private async handleUserDeleted(data: any, attributes: Record<string, string>, messageId: string): Promise<void> {
    console.log(`👤 Processing user deletion:`, { 
      userId: data.userId, 
      messageId 
    });
    
    // Simulate user deletion processing
    // - Clean up user data
    // - Remove from analytics
    // - Notify external systems
    
    await this.simulateProcessing(800);
    console.log(`✅ User deletion processed: ${data.userId}`);
  }

  private async simulateProcessing(delayMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
