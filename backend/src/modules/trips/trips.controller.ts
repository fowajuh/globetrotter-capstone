import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TripRoleGuard, RequireTripRole } from '../../common/guards/trip-role.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TripsService } from './trips.service';
import { AddCollaboratorDto, CreateTripDto, ListTripsQuery, PatchTripDto } from './dto/trip.dto';

@Controller('trips')
@UseGuards(JwtAuthGuard, TripRoleGuard)
export class TripsController {
  constructor(private trips: TripsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }, @Query() query: unknown) {
    const parsed = ListTripsQuery.safeParse(query);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.trips.list(user.id, parsed.data);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = CreateTripDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.trips.create(user.id, parsed.data);
  }

  @Get(':id')
  @RequireTripRole('viewer')
  get(@Param('id') id: string) {
    return this.trips.getById(id);
  }

  @Patch(':id')
  @RequireTripRole('editor')
  update(@Param('id') id: string, @Body() body: unknown) {
    const parsed = PatchTripDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.trips.update(id, parsed.data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.trips.remove(id, user.id);
  }

  @Post(':id/duplicate')
  @RequireTripRole('viewer')
  duplicate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.trips.duplicate(id, user.id);
  }

  @Post(':id/collaborators')
  @RequireTripRole('editor')
  addCollaborator(@Param('id') id: string, @Body() body: unknown) {
    const parsed = AddCollaboratorDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.trips.addCollaborator(id, parsed.data);
  }
}
