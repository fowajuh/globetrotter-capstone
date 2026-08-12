import { z } from 'zod';

export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  travelStyle: z.enum(['shoestring', 'comfort', 'luxury']).optional(),
  homeCurrency: z.string().length(3).optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;
