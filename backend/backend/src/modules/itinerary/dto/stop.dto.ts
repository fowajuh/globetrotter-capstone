import { z } from 'zod';

export const CreateStopDto = z.object({
  dayIndex: z.number().int().nonnegative(),
  orderIndex: z.number().int().nonnegative(),
  name: z.string().min(1).max(160),
  category: z.enum(['flight', 'stay', 'eat', 'see', 'move']).default('see'),
  city: z.string().max(120).nullable().optional(),
  country: z.string().max(120).nullable().optional(),
  booked: z.boolean().default(false),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  startTime: z.string().datetime().nullable().optional(),
  endTime: z.string().datetime().nullable().optional(),
  cost: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).nullable().optional(),
});
export type CreateStopDto = z.infer<typeof CreateStopDto>;

export const PatchStopDto = CreateStopDto.partial();
export type PatchStopDto = z.infer<typeof PatchStopDto>;

export const ReorderStopsDto = z.object({
  // full ordering for one day: [{id, orderIndex}] — sent as one batch so a
  // drag-to-reorder gesture is a single atomic write, never a half state.
  order: z.array(z.object({ id: z.string().uuid(), orderIndex: z.number().int().nonnegative() })).min(1),
});
export type ReorderStopsDto = z.infer<typeof ReorderStopsDto>;

export const CreateCommentDto = z.object({ body: z.string().min(1).max(2000) });
export type CreateCommentDto = z.infer<typeof CreateCommentDto>;
