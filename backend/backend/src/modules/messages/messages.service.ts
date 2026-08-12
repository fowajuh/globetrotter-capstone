import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateConversationDto,
  ListConversationsQuery,
  ListMessagesQuery,
  SendMessageDto,
} from './dto/message.dto';
import { ChatGateway } from './chat.gateway';

const HOST_REPLIES = [
  "Thanks for reaching out! I'll get back to you with details shortly.",
  'Good question — let me check and confirm with you.',
  "Yes, that works. Let me know if you need anything else before your stay.",
  "Happy to help! I'll send over the details in a moment.",
];

/**
 * Owns `conversations` + `messages`. There's no separate host account
 * system yet, so a host's "replies" are simulated server-side (persisted
 * and pushed over the socket exactly like a real message would be) rather
 * than faked client-side — that keeps the API honest: refresh, switch
 * devices, or reopen the thread and the history is still there.
 */
@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway)) private gateway: ChatGateway,
  ) {}

  async listConversations(userId: string, query: ListConversationsQuery) {
    const rows = await this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: { where: { senderRole: 'host', readAt: null } } } },
      },
    });
    const hasMore = rows.length > query.limit;
    const items = (hasMore ? rows.slice(0, -1) : rows).map((c: (typeof rows)[number]) => ({
      id: c.id,
      listingId: c.listingId,
      listingTitle: c.listingTitle,
      listingImageUrl: c.listingImageUrl,
      hostName: c.hostName,
      hostAvatarUrl: c.hostAvatarUrl,
      lastMessage: c.messages[0]?.body ?? null,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c._count.messages,
    }));
    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getConversation(userId: string, id: string) {
    const convo = await this.prisma.conversation.findFirst({ where: { id, userId } });
    if (!convo) throw new NotFoundException('conversation not found');
    return convo;
  }

  /** Find-or-create by (userId, listingId) so re-opening "message host" on
   *  the same listing continues the existing thread instead of forking it. */
  async findOrCreateConversation(userId: string, dto: CreateConversationDto) {
    const existing = await this.prisma.conversation.findUnique({
      where: { userId_listingId: { userId, listingId: dto.listingId } },
    });
    const convo =
      existing ??
      (await this.prisma.conversation.create({
        data: {
          userId,
          listingId: dto.listingId,
          listingTitle: dto.listingTitle,
          listingImageUrl: dto.listingImageUrl ?? null,
          hostName: dto.hostName,
          hostAvatarUrl: dto.hostAvatarUrl ?? null,
        },
      }));

    if (dto.firstMessage) {
      await this.sendMessage(userId, convo.id, { body: dto.firstMessage });
    }
    return this.getConversation(userId, convo.id);
  }

  async listMessages(userId: string, conversationId: string, query: ListMessagesQuery) {
    await this.getConversation(userId, conversationId); // ownership check

    // Newest-first for cursor pagination ("load older messages"), reversed
    // to chronological order for the caller since that's what a chat UI renders.
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, -1) : rows;

    await this.prisma.message.updateMany({
      where: { conversationId, senderRole: 'host', readAt: null },
      data: { readAt: new Date() },
    });

    return { items: items.reverse(), nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.getConversation(userId, conversationId); // ownership check

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, senderRole: 'user', body: dto.body },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });
    this.gateway.broadcastMessage(conversationId, message);

    this.scheduleHostReply(conversationId);
    return message;
  }

  markRead(userId: string, conversationId: string) {
    return this.getConversation(userId, conversationId).then(() =>
      this.prisma.message.updateMany({
        where: { conversationId, senderRole: 'host', readAt: null },
        data: { readAt: new Date() },
      }),
    );
  }

  private scheduleHostReply(conversationId: string) {
    const delayMs = 1200 + Math.floor(Math.random() * 1800);
    setTimeout(async () => {
      const body = HOST_REPLIES[Math.floor(Math.random() * HOST_REPLIES.length)];
      const message = await this.prisma.message.create({
        data: { conversationId, senderId: null, senderRole: 'host', body },
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      this.gateway.broadcastMessage(conversationId, message);
    }, delayMs);
  }
}
