import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TripsModule } from './modules/trips/trips.module';
import { ItineraryModule } from './modules/itinerary/itinerary.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { BudgetModule } from './modules/budget/budget.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    ItineraryModule,
    RecommendationsModule,
    BudgetModule,
    NotificationsModule,
    RealtimeModule,
    MessagesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
