import { z } from 'zod';

export const CreateTripDto = z.object({
  name: z.string().min(1).max(120),
  subtitle: z.string().max(160).nullable().optional(),
  coverPhotoUrl: z.string().url().nullable().optional(),
  originCode: z.string().max(8).nullable().optional(),
  destinationCode: z.string().max(8).nullable().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budgetPlanned: z.number().nonnegative().default(0),
});
export type CreateTripDto = z.infer<typeof CreateTripDto>;

export const PatchTripDto = CreateTripDto.partial().extend({
  status: z.enum(['draft', 'upcoming', 'active', 'past']).optional(),
});
export type PatchTripDto = z.infer<typeof PatchTripDto>;

export const AddCollaboratorDto = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
});
export type AddCollaboratorDto = z.infer<typeof AddCollaboratorDto>;

export const ListTripsQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListTripsQuery = z.infer<typeof ListTripsQuery>;
