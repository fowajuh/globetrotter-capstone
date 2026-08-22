import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChatGateway } from './chat.gateway';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [JwtModule.register({}), PrismaModule, NotificationsModule],
  controllers: [MessagesController, CallsController],
  providers: [MessagesService, ChatGateway, CallsService],
})
export class MessagesModule {}
