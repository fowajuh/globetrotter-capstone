import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global so every feature module can inject PrismaService without each
// one re-importing this module — matches how trips/itinerary/etc modules
// were already written (they inject PrismaService with no local provider).
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
