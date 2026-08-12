// exports RealtimeGateway for presence + live comments
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ItineraryModule } from '../itinerary/itinerary.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [JwtModule.register({}), ItineraryModule, PrismaModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
