import { z } from 'zod';

export const TripSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1).max(120),
  coverPhotoUrl: z.string().url().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budgetPlanned: z.number().nonnegative(),
  status: z.enum(['draft', 'upcoming', 'active', 'past']),
});
export type Trip = z.infer<typeof TripSchema>;

export const StopSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  dayIndex: z.number().int().nonnegative(),
  orderIndex: z.number().int().nonnegative(),
  name: z.string().min(1),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  cost: z.number().nonnegative(),
  currency: z.string().length(3),
  notes: z.string().nullable(),
});
export type Stop = z.infer<typeof StopSchema>;

export const CreateTripDto = TripSchema.pick({
  name: true,
  coverPhotoUrl: true,
  startDate: true,
  endDate: true,
  budgetPlanned: true,
});

export const RecommendationSchema = z.object({
  title: z.string(),
  category: z.string(),
  blurb: z.string(),
  estCost: z.number().nonnegative(),
  currency: z.string().length(3),
});
