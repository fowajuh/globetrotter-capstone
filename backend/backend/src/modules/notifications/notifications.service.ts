import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Stage 1: synchronous read/write against Postgres. Stage 4: Itinerary
 * Service publishes `trip.updated`/`comment.created` events, this service
 * becomes a queue consumer that fans notifications out from those events
 * instead of being called inline (§5 Stage 4) — the `create()` method
 * signature doesn't need to change for that swap.
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  async create(userId: string, type: string, payload: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: { userId, type, payloadJson: payload as any },
    });
  }
}
