import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export type TripRole = 'owner' | 'editor' | 'viewer';
export const RequireTripRole = (...roles: TripRole[]) => SetMetadata('tripRoles', roles);

/**
 * Enforces the owner/editor/viewer model from §4/§6 on any route with a
 * `:tripId` (or `:id` for the trip itself) param. Editors can write,
 * viewers can only read — checked here once instead of in every service.
 */
@Injectable()
export class TripRoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<TripRole[]>('tripRoles', context.getHandler()) ?? [];
    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const tripId = req.params.tripId ?? req.params.id;
    const userId = req.user?.id;
    if (!tripId || !userId) throw new ForbiddenException('trip context missing');

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new ForbiddenException('trip not found');
    if (trip.ownerId === userId) return true; // owner always allowed

    const collab = await this.prisma.tripCollaborator.findUnique({
      where: { tripId_userId: { tripId, userId } },
    });
    if (!collab) throw new ForbiddenException('not a collaborator on this trip');
    if (required.includes('editor') && collab.role === 'viewer') {
      throw new ForbiddenException('viewer role cannot perform this action');
    }
    return true;
  }
}
