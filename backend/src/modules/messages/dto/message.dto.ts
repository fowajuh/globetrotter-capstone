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

/** Data-URL media payload (Stage 1 has no object storage — see main.ts for
 *  the matching body-size limit). Capped ~9MB decoded, comfortably under the
 *  10mb express.json() limit once you account for base64's ~33% overhead
 *  and JSON escaping. */
const MEDIA_URL_MAX_CHARS = 9_500_000;

const baseFields = {
  mediaUrl: z.string().startsWith("data:").max(MEDIA_URL_MAX_CHARS),
  mediaMimeType: z.string().min(1).max(120),
};

export const SendMessageDto = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    body: z.string().min(1).max(4000),
  }),
  z.object({
    type: z.literal("voice"),
    body: z.string().max(4000).default(""),
    ...baseFields,
    mediaDurationSec: z.number().int().min(1).max(300),
  }),
  z.object({
    type: z.literal("image"),
    body: z.string().max(4000).default(""),
    ...baseFields,
  }),
  z.object({
    type: z.literal("file"),
    body: z.string().max(4000).default(""),
    ...baseFields,
    fileName: z.string().min(1).max(255),
    fileSizeBytes: z.number().int().min(1).max(15_000_000),
  }),
]);
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
