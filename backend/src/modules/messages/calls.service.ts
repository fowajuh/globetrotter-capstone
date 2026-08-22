import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Simulated voice calls to a listing's host, following the same principle
 * as MessagesService's host auto-replies: there's no real telephony peer,
 * but every state transition is server-timed and persisted, so two open
 * tabs (or a refresh mid-call) see the identical, real lifecycle instead of
 * the client inventing a fake timer.
 *
 * Lifecycle: ringing -> (auto, after a random delay) active -> (user hangs
 * up) ended, OR ringing -> (small chance, longer delay) no_answer.
 */
@Injectable()
export class CallsService {
  // callId -> pending "answer"/"no answer" timer, so an early hangup can
  // cancel the simulated pickup instead of racing it.
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway)) private gateway: ChatGateway,
    private notifications: NotificationsService,
  ) {}

  private async ownedConversation(userId: string, conversationId: string) {
    const convo = await this.prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (!convo) throw new NotFoundException('conversation not found');
    return convo;
  }

  async startCall(userId: string, conversationId: string) {
    const convo = await this.ownedConversation(userId, conversationId);

    const call = await this.prisma.callLog.create({
      data: { conversationId, status: 'ringing' },
    });
    this.gateway.broadcastCallEvent(conversationId, call);

    // ~85% of the time the host "answers" quickly; otherwise the call rings
    // out. Mirrors real variance instead of a robotic instant pickup.
    const answers = Math.random() < 0.85;
    const delayMs = answers ? 1400 + Math.random() * 2200 : 7000 + Math.random() * 2500;

    const timer = setTimeout(async () => {
      this.pendingTimers.delete(call.id);
      if (answers) {
        const active = await this.prisma.callLog.update({
          where: { id: call.id },
          data: { status: 'active', connectedAt: new Date() },
        });
        this.gateway.broadcastCallEvent(conversationId, active);
      } else {
        await this.finalize(userId, call.id, conversationId, convo.hostName, 'no_answer');
      }
    }, delayMs);
    this.pendingTimers.set(call.id, timer);

    return call;
  }

  async endCall(userId: string, conversationId: string, callId: string) {
    const convo = await this.ownedConversation(userId, conversationId);
    const call = await this.prisma.callLog.findFirst({ where: { id: callId, conversationId } });
    if (!call) throw new NotFoundException('call not found');
    if (call.status !== 'ringing' && call.status !== 'active') return call; // already terminal

    const pending = this.pendingTimers.get(callId);
    if (pending) {
      clearTimeout(pending);
      this.pendingTimers.delete(callId);
    }

    const status = call.status === 'active' ? 'ended' : 'no_answer';
    return this.finalize(userId, callId, conversationId, convo.hostName, status);
  }

  private async finalize(
    userId: string,
    callId: string,
    conversationId: string,
    hostName: string,
    status: 'ended' | 'no_answer',
  ) {
    const existing = await this.prisma.callLog.findUniqueOrThrow({ where: { id: callId } });
    const endedAt = new Date();
    const durationSec = existing.connectedAt
      ? Math.max(0, Math.round((endedAt.getTime() - existing.connectedAt.getTime()) / 1000))
      : 0;

    const call = await this.prisma.callLog.update({
      where: { id: callId },
      data: { status, endedAt, durationSec },
    });

    const body = status === 'ended' ? 'Voice call' : `No answer from ${hostName}`;
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        senderRole: 'user',
        type: 'call',
        body,
        callStatus: status,
        callDurationSec: durationSec,
      },
    });
    await this.prisma.callLog.update({ where: { id: callId }, data: { messageId: message.id } });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    this.gateway.broadcastCallEvent(conversationId, call);
    this.gateway.broadcastMessage(conversationId, message);

    if (status === 'no_answer') {
      this.notifications
        .create(userId, 'call_missed', { conversationId, hostName })
        .catch((err) => console.error('Failed to create missed-call notification:', err));
    }

    return call;
  }
}
