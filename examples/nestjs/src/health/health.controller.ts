import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  HealthCheckResult 
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Add PubSub-specific health checks here
      () => this.checkPubSubConnection(),
    ]);
  }

  private async checkPubSubConnection(): Promise<{ pubsub: { status: string } }> {
    try {
      // Simple health check - in a real app you might ping the PubSub service
      // or check if the consumer is running
      return {
        pubsub: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        pubsub: {
          status: 'down',
        },
      };
    }
  }
}
