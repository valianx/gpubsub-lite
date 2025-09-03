import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PubSubModule } from './pubsub/pubsub.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    TerminusModule,
    PubSubModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
