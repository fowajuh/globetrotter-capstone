import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, WebSocket } from 'ws';
import { ItineraryService } from '../itinerary/itinerary.service';
import { PrismaService } from '../../prisma/prisma.service';

type AuthedSocket = WebSocket & { userId?: string; tripId?: string };

/**
 * Presence + live comment/stop updates for a trip (§3.6, §7 `WS /ws/trips/:id`).
 * Stage 1: in-process, single instance. Stage 4: swap the room registry for
 * Redis pub/sub so presence works across multiple gateway instances —
 * nothing above this class needs to change.
 *
 * The access token travels as a query param (`?token=...&tripId=...`)
 * because browser WebSocket clients can't set an Authorization header.
 * Same secret/verification path as JwtAuthGuard, so a token good for REST
 * is good here too.
 */
@WebSocketGateway({ path: '/ws/trips' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private presence = new Map<string, Map<string, { userId: string; name: string }>>(); // tripId -> socketId->user

  constructor(
    private jwt: JwtService,
    private itinerary: ItineraryService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthedSocket, req: { url?: string }) {
    try {
      const url = new URL(req.url ?? '', 'ws://localhost');
      const token = url.searchParams.get('token');
      const tripId = url.searchParams.get('tripId');
      if (!token || !tripId) throw new Error('missing token or tripId');

      const payload = this.jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET }) as {
        sub: string;
        email: string;
      };

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('unknown user');

      client.userId = user.id;
      client.tripId = tripId;
      (client as any).__socketId = Math.random().toString(36).slice(2);

      if (!this.presence.has(tripId)) this.presence.set(tripId, new Map());
      this.presence.get(tripId)!.set((client as any).__socketId, { userId: user.id, name: user.name });
      this.broadcastPresence(tripId);
    } catch {
      client.close(4001, 'unauthorized');
    }
  }

  handleDisconnect(client: AuthedSocket) {
    if (!client.tripId) return;
    const room = this.presence.get(client.tripId);
    room?.delete((client as any).__socketId);
    this.broadcastPresence(client.tripId);
  }

  @SubscribeMessage('comment')
  async onComment(client: AuthedSocket, payload: { stopId: string; body: string }) {
    if (!client.userId || !client.tripId) return;
    try {
      const saved = await this.itinerary.addComment(payload.stopId, client.userId, { body: payload.body });
      this.broadcastToTrip(client.tripId, { type: 'comment', tripId: client.tripId, stopId: payload.stopId, comment: saved });
    } catch (err) {
      client.send(JSON.stringify({ type: 'error', message: (err as Error).message }));
    }
  }

  /** Fired by ItineraryService writes (stop create/patch/reorder) so every
   * collaborator's manifest strip stays live without polling. */
  broadcastTripUpdated(tripId: string) {
    this.broadcastToTrip(tripId, { type: 'trip.updated', tripId });
  }

  private broadcastPresence(tripId: string) {
    const room = this.presence.get(tripId);
    const users = room ? Array.from(room.values()) : [];
    this.broadcastToTrip(tripId, { type: 'presence', tripId, users });
  }

  private broadcastToTrip(tripId: string, message: unknown) {
    const payload = JSON.stringify(message);
    this.server.clients.forEach((c: AuthedSocket) => {
      if (c.tripId === tripId && c.readyState === WebSocket.OPEN) c.send(payload);
    });
  }
}
