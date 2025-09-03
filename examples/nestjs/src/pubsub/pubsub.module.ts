import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPubSubClient, PubSubClient } from '@valianx/pubsub-lite';
import { PubSubService } from './pubsub.service';
import { ConsumerService } from './consumer.service';

// PubSub client provider
const PUBSUB_CLIENT = 'PUBSUB_CLIENT';

const pubSubClientProvider = {
  provide: PUBSUB_CLIENT,
  useFactory: (): PubSubClient => {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    
    if (!projectId) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
    }
    
    return createPubSubClient({
      projectId,
      // Additional configuration can be added here
    });
  },
};

@Global()
@Module({
  providers: [
    pubSubClientProvider,
    PubSubService,
    ConsumerService,
  ],
  exports: [
    PUBSUB_CLIENT,
    PubSubService,
    ConsumerService,
  ],
})
export class PubSubModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly consumerService: ConsumerService,
  ) {}

  async onModuleInit() {
    console.log('🔌 Initializing PubSub module...');
    
    try {
      // Start the consumer service
      await this.consumerService.start();
      console.log('✅ PubSub consumer started successfully');
    } catch (error) {
      console.error('❌ Failed to start PubSub consumer:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log('🔌 Shutting down PubSub module...');
    
    try {
      // Stop the consumer service gracefully
      await this.consumerService.stop();
      console.log('✅ PubSub consumer stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping PubSub consumer:', error.message);
    }
  }
}

export { PUBSUB_CLIENT };
