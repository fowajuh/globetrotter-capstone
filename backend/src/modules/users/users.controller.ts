import { Body, Controller, Delete, Get, Patch, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.users.me(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    const parsed = UpdateProfileDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.users.updateProfile(user.id, parsed.data);
  }

  @Get('me/subscription')
  getSubscription(@CurrentUser() user: { id: string }) {
    return this.users.getSubscription(user.id);
  }

  @Patch('me/subscription')
  updateSubscription(@CurrentUser() user: { id: string }, @Body() body: any) {
    const { plan, billingCycle } = body;
    if (!['explorer', 'voyager', 'crew'].includes(plan)) {
      throw new UnauthorizedException('invalid plan');
    }
    if (!['monthly', 'annual'].includes(billingCycle)) {
      throw new UnauthorizedException('invalid billing cycle');
    }
    return this.users.updateSubscription(user.id, plan, billingCycle);
  }

  @Delete('me/subscription')
  cancelSubscription(@CurrentUser() user: { id: string }) {
    return this.users.cancelSubscription(user.id);
  }
}
