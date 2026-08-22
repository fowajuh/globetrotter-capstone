import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * GET /trips/:id/budget-summary (§7). Returns both "by day" and "by
 * category" views in one payload so the frontend's morph between chart
 * modes is a client-side transition, not two round trips.
 */
@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  async summary(tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, include: { stops: true } });
    if (!trip) throw new NotFoundException('trip not found');

    const spent = trip.stops.reduce((sum: number, s: any) => sum + Number(s.cost), 0);
    const planned = Number(trip.budgetPlanned);

    const byDay = new Map<number, number>();
    for (const s of trip.stops) byDay.set(s.dayIndex, (byDay.get(s.dayIndex) ?? 0) + Number(s.cost));

    // Stop.category is a real column (flight/stay/eat/see/move) — group on
    // it directly rather than the previous name-splitting heuristic, which
    // predated the category field shipping.
    const byCategory = new Map<string, number>();
    for (const s of trip.stops) {
      const key = s.category || 'other';
      byCategory.set(key, (byCategory.get(key) ?? 0) + Number(s.cost));
    }

    return {
      tripId,
      currency: trip.stops[0]?.currency ?? 'USD',
      planned,
      spent,
      remaining: planned - spent,
      overBudget: spent > planned,
      byDay: Array.from(byDay.entries()).map(([dayIndex, total]) => ({ dayIndex, total })),
      byCategory: Array.from(byCategory.entries()).map(([category, total]) => ({ category, total })),
    };
  }
}
