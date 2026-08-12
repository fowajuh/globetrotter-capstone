import { z } from 'zod';

export const GetRecommendationsQuery = z.object({
  interests: z.string().transform((s) => s.split(',').map((i) => i.trim()).filter(Boolean)),
  budgetStyle: z.enum(['shoestring', 'comfort', 'luxury']).default('comfort'),
});
export type GetRecommendationsQuery = z.infer<typeof GetRecommendationsQuery>;
