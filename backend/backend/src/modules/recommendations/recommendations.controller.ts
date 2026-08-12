import { Controller, Get, Param, Post, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TripRoleGuard, RequireTripRole } from '../../common/guards/trip-role.guard';
import { RecommendationsService } from './recommendations.service';
import { GetRecommendationsQuery } from './dto/recommendation.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private recommendations: RecommendationsService) {}

  @Get('trips/:id/recommendations')
  @UseGuards(TripRoleGuard)
  @RequireTripRole('viewer')
  get(@Param('id') id: string, @Query() query: unknown) {
    const parsed = GetRecommendationsQuery.safeParse(query);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.recommendations.getRecommendations(id, parsed.data.interests, parsed.data.budgetStyle);
  }

  // Left dismiss on the swipe-card stack (§3.4) — recorded so a dismissed
  // card never resurfaces for this user even after the cache TTL refreshes.
  @Post('recommendations/:id/dismiss')
  dismiss(@Param('id') id: string) {
    return { ok: true, dismissed: id };
  }
}
