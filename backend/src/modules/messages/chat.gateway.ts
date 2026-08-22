import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { PrismaService } from '../../prisma/prisma.service';

type AuthedSocket = WebSocket & { userId?: string; conversationId?: string };

/**
 * Live push for a single chat thread. Same shape as RealtimeGateway
 * (token-in-query-param auth, one room per id) but keyed by conversationId
 * instead of tripId — kept separate because chat and trip presence are
 * different lifecycles and this way neither gateway's room map grows
 * unbounded with the other's traffic.
 */
@WebSocketGateway({ path: '/ws/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private rooms = new Map<string, Set<AuthedSocket>>(); // conversationId -> sockets

  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async handleConnection(client: AuthedSocket, req: { url?: string }) {
    try {
      const url = new URL(req.url ?? '', 'ws://localhost');
      const token = url.searchParams.get('token');
      const conversationId = url.searchParams.get('conversationId');
      if (!token || !conversationId) throw new Error('missing token or conversationId');

      const payload = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET }) as { sub: string };

      const convo = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId: payload.sub },
      });
      if (!convo) throw new Error('conversation not found or not yours');

      client.userId = payload.sub;
      client.conversationId = conversationId;
      if (!this.rooms.has(conversationId)) this.rooms.set(conversationId, new Set());
      this.rooms.get(conversationId)!.add(client);
    } catch {
      client.close(4001, 'unauthorized');
    }
  }

  handleDisconnect(client: AuthedSocket) {
    if (!client.conversationId) return;
    this.rooms.get(client.conversationId)?.delete(client);
  }

  /** Called by MessagesService right after persisting a message (user or
   *  simulated host reply) so every open tab on this thread updates live. */
  broadcastMessage(conversationId: string, message: unknown) {
    this.broadcastToRoom(conversationId, { type: 'message', conversationId, message });
  }

  /** Called by CallsService on every call state transition (ringing ->
   *  active -> ended/declined/missed) so the call screen in every open tab
   *  animates in lockstep with the server-timed state instead of guessing
   *  locally with setTimeout. */
  broadcastCallEvent(conversationId: string, call: unknown) {
    this.broadcastToRoom(conversationId, { type: 'call', conversationId, call });
  }

  private broadcastToRoom(conversationId: string, payload: Record<string, unknown>) {
    const room = this.rooms.get(conversationId);
    if (!room) return;
    const data = JSON.stringify(payload);
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    }
  }
}
