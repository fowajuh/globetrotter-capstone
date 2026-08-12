import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * GET /trips/:id/budget-summary (§7). Returns both "by day" and "by
 * category" views in one payload so the frontend's morph between chart
 * modes (§3.5) is a client-side transition, not two round trips.
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

    // No dedicated category column in Stage 1 — bucket by the leading word
    // of the stop name as a lightweight proxy until a real `category` field
    // ships; swap this line for a real GROUP BY once that column exists.
    const byCategory = new Map<string, number>();
    for (const s of trip.stops) {
      const key = s.name.split(' ')[0].toLowerCase();
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
