import { z } from 'zod';

export const ClerkDto = z.object({
  token: z.string(),
});

export type ClerkDto = z.infer<typeof ClerkDto>;
