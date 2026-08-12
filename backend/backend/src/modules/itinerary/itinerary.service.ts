import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, CreateStopDto, PatchStopDto, ReorderStopsDto } from './dto/stop.dto';

/**
 * Owns `stops` + `comments`. Split out of TripsService deliberately (§5:
 * "Itinerary Service — trips, stops, collaborators, comments") — both
 * classes together are the whole future Itinerary Service, unchanged.
 */
@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  /** Editors/owner only. Viewers get ForbiddenException — checked here since
   * stop routes are addressed by stopId, not tripId, so TripRoleGuard can't
   * resolve the trip on its own. */
  private async assertCanEdit(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('trip not found');
    if (trip.ownerId === userId) return;
    const collab = await this.prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!collab || collab.role === 'viewer') {
      throw new ForbiddenException('editor access required');
    }
  }

  private async stopWithTrip(stopId: string) {
    const stop = await this.prisma.stop.findUnique({ where: { id: stopId } });
    if (!stop) throw new NotFoundException('stop not found');
    return stop;
  }

  async createStop(tripId: string, userId: string, dto: CreateStopDto) {
    await this.assertCanEdit(tripId, userId);
    return this.prisma.stop.create({
      data: {
        tripId,
        dayIndex: dto.dayIndex,
        orderIndex: dto.orderIndex,
        name: dto.name,
        category: dto.category,
        city: dto.city ?? null,
        country: dto.country ?? null,
        booked: dto.booked,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        cost: dto.cost,
        currency: dto.currency,
        notes: dto.notes ?? null,
      },
    });
  }

  async patchStop(stopId: string, userId: string, dto: PatchStopDto) {
    const stop = await this.stopWithTrip(stopId);
    await this.assertCanEdit(stop.tripId, userId);
    const data: Record<string, unknown> = { ...dto };
    if (dto.startTime !== undefined) data.startTime = dto.startTime ? new Date(dto.startTime) : null;
    if (dto.endTime !== undefined) data.endTime = dto.endTime ? new Date(dto.endTime) : null;
    return this.prisma.stop.update({ where: { id: stopId }, data });
  }

  async deleteStop(stopId: string, userId: string) {
    const stop = await this.stopWithTrip(stopId);
    await this.assertCanEdit(stop.tripId, userId);
    await this.prisma.stop.delete({ where: { id: stopId } });
    return { ok: true };
  }

  /** Atomic drag-to-reorder write — a transaction so the manifest strip
   * never renders a half-reordered day mid-drag (§3.3). */
  async reorder(stopId: string, userId: string, dto: ReorderStopsDto) {
    const stop = await this.stopWithTrip(stopId);
    await this.assertCanEdit(stop.tripId, userId);
    await this.prisma.$transaction(
      dto.order.map((o) =>
        this.prisma.stop.update({ where: { id: o.id }, data: { orderIndex: o.orderIndex } }),
      ),
    );
    return { ok: true };
  }

  async listComments(stopId: string) {
    await this.stopWithTrip(stopId);
    return this.prisma.comment.findMany({
      where: { stopId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async addComment(stopId: string, userId: string, dto: CreateCommentDto) {
    const stop = await this.stopWithTrip(stopId);
    // any collaborator (including viewers) can comment — only edits are gated
    const trip = await this.prisma.trip.findUnique({ where: { id: stop.tripId } });
    if (!trip) throw new NotFoundException('trip not found');
    const isMember =
      trip.ownerId === userId ||
      (await this.prisma.tripCollaborator.findUnique({ where: { tripId_userId: { tripId: stop.tripId, userId } } }));
    if (!isMember) throw new ForbiddenException('not a member of this trip');

    return this.prisma.comment.create({
      data: { stopId, userId, body: dto.body },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }
}
