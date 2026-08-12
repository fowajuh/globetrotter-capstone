import { z } from 'zod';

export const CreateConversationDto = z.object({
  listingId: z.string().min(1).max(120),
  listingTitle: z.string().min(1).max(200),
  listingImageUrl: z.string().url().nullable().optional(),
  hostName: z.string().min(1).max(120),
  hostAvatarUrl: z.string().url().nullable().optional(),
  /** Optional opening message so "message host" from a listing page can
   *  create the thread and send the first message in one call. */
  firstMessage: z.string().min(1).max(4000).optional(),
});
export type CreateConversationDto = z.infer<typeof CreateConversationDto>;

export const SendMessageDto = z.object({
  body: z.string().min(1).max(4000),
});
export type SendMessageDto = z.infer<typeof SendMessageDto>;

export const ListConversationsQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListConversationsQuery = z.infer<typeof ListConversationsQuery>;

export const ListMessagesQuery = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type ListMessagesQuery = z.infer<typeof ListMessagesQuery>;
