import { Inject, Injectable } from '@nestjs/common';
import { createPublisher, Publisher, PubSubClient } from '@valianx/pubsub-lite';
import { PUBSUB_CLIENT } from './pubsub.module';

@Injectable()
export class PubSubService {
  private publisher: Publisher;

  constructor(
    @Inject(PUBSUB_CLIENT) private readonly client: PubSubClient,
  ) {
    const topicName = process.env.PUBSUB_TOPIC || 'user-events';
    
    this.publisher = createPublisher(this.client, topicName, {
      // Add default attributes to all messages
      attributesDefaults: {
        source: 'nestjs-app',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      
      // Configure retry behavior
      retry: {
        retryDelayMs: 100,
        maxRetryDelayMs: 10000,
        maxAttempts: 5,
      },
      
      // Configure hooks for observability
      hooks: {
        onPublishStart: (data, attributes) => {
          console.log(`📤 Publishing message:`, { 
            type: data.type, 
            id: data.id,
            attributes 
          });
        },
        
        onPublishSuccess: (data, attributes, messageId) => {
          console.log(`✅ Message published successfully:`, {
            type: data.type,
            id: data.id,
            messageId,
          });
        },
        
        onPublishError: (data, attributes, error) => {
          console.error(`❌ Failed to publish message:`, {
            type: data.type,
            id: data.id,
            error: error.message,
          });
        },
        
        onPublishRetry: (data, attributes, attempt, error) => {
          console.warn(`🔄 Retrying message publish (attempt ${attempt}):`, {
            type: data.type,
            id: data.id,
            error: error.message,
          });
        },
      },
    });
  }

  /**
   * Publish a user event
   */
  async publishUserEvent(event: UserEvent): Promise<string> {
    return this.publisher.publish(event, {
      eventType: event.type,
      userId: event.userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Publish any event with custom attributes
   */
  async publishEvent(event: any, attributes?: Record<string, string>): Promise<string> {
    return this.publisher.publish(event, attributes);
  }

  /**
   * Flush any pending batched messages
   */
  async flush(): Promise<void> {
    await this.publisher.flush();
  }
}

// Event type definitions
export interface UserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  userId: string;
  timestamp?: string;
  data?: any;
}
