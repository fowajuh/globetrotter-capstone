import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TripRoleGuard, RequireTripRole } from '../../common/guards/trip-role.guard';
import { BudgetService } from './budget.service';

@Controller('trips')
@UseGuards(JwtAuthGuard, TripRoleGuard)
export class BudgetController {
  constructor(private budget: BudgetService) {}

  @Get(':id/budget-summary')
  @RequireTripRole('viewer')
  summary(@Param('id') id: string) {
    return this.budget.summary(id);
  }
}
