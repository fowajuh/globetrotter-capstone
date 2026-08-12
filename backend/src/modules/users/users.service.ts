import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        travelStyle: true, homeCurrency: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('user not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    // If no subscription exists, default to explorer plan
    if (!subscription) {
      return {
        plan: 'explorer',
        billingCycle: 'monthly',
        status: 'active',
      };
    }
    return subscription;
  }

  async updateSubscription(userId: string, plan: 'explorer' | 'voyager' | 'crew', billingCycle: 'monthly' | 'annual') {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: 'active',
      },
      create: {
        userId,
        plan,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: 'active',
      },
    });
  }

  async cancelSubscription(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });
  }
}
