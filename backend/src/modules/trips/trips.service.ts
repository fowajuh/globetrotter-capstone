import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AddCollaboratorDto,
  CreateTripDto,
  ListTripsQuery,
  PatchTripDto,
} from './dto/trip.dto';

/**
 * Owns `trips` + `trip_collaborators` exclusively (§5 Stage 2: this becomes
 * half of the Itinerary Service, the other half is StopsService below).
 */
@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  /** Cursor-paginated from day one per §7, so it never needs to change shape in Stage 3. */
  async list(userId: string, query: ListTripsQuery) {
    const rows = await this.prisma.trip.findMany({
      where: { OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] },
      orderBy: { startDate: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, -1) : rows;
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async create(userId: string, dto: CreateTripDto) {
    return this.prisma.trip.create({
      data: {
        ownerId: userId,
        name: dto.name,
        subtitle: dto.subtitle ?? null,
        coverPhotoUrl: dto.coverPhotoUrl ?? null,
        originCode: dto.originCode ?? null,
        destinationCode: dto.destinationCode ?? null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        budgetPlanned: dto.budgetPlanned,
      },
    });
  }

  async getById(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stops: { orderBy: [{ dayIndex: 'asc' }, { orderIndex: 'asc' }] },
        collaborators: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
    if (!trip) throw new NotFoundException('trip not found');
    return trip;
  }

  async update(tripId: string, dto: PatchTripDto) {
    const data: Record<string, unknown> = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    return this.prisma.trip.update({ where: { id: tripId }, data });
  }

  async remove(tripId: string, requesterId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('trip not found');
    if (trip.ownerId !== requesterId) throw new ForbiddenException('only the owner can delete a trip');
    await this.prisma.trip.delete({ where: { id: tripId } });
    return { ok: true };
  }

  async duplicate(tripId: string, requesterId: string) {
    const original = await this.getById(tripId);
    const copy = await this.prisma.trip.create({
      data: {
        ownerId: requesterId,
        name: `${original.name} (copy)`,
        subtitle: original.subtitle,
        coverPhotoUrl: original.coverPhotoUrl,
        originCode: original.originCode,
        destinationCode: original.destinationCode,
        startDate: original.startDate,
        endDate: original.endDate,
        budgetPlanned: original.budgetPlanned,
        status: 'draft',
        stops: {
          create: original.stops.map((s: any) => ({
            dayIndex: s.dayIndex,
            orderIndex: s.orderIndex,
            name: s.name,
            category: s.category,
            city: s.city,
            country: s.country,
            booked: s.booked,
            lat: s.lat,
            lng: s.lng,
            startTime: s.startTime,
            endTime: s.endTime,
            cost: s.cost,
            currency: s.currency,
            notes: s.notes,
          })),
        },
      },
    });
    return copy;
  }

  async addCollaborator(tripId: string, dto: AddCollaboratorDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('no account with that email');
    return this.prisma.tripCollaborator.upsert({
      where: { tripId_userId: { tripId, userId: user.id } },
      update: { role: dto.role },
      create: { tripId, userId: user.id, role: dto.role },
    });
  }
}
