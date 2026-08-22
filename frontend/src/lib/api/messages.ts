import { api } from "@/lib/api-client";
import { useBackendAuth } from "@/lib/auth-store";

/** Mirrors backend/prisma/schema.prisma: model Conversation (list view, with
 *  a preview of the last message — see MessagesService.listConversations). */
export type ConversationSummary = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  hostName: string;
  hostAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
};

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  hostName: string;
  hostAvatarUrl: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageType = "text" | "voice" | "image" | "file" | "call";
export type CallStatus = "ringing" | "active" | "ended" | "no_answer";

/** Mirrors model Message. senderRole "host" is server-simulated for now —
 *  there's no separate host account system yet (see MessagesService). */
export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderRole: "user" | "host";
  type: MessageType;
  body: string;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  mediaDurationSec: number | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  callStatus: CallStatus | null;
  callDurationSec: number | null;
  readAt: string | null;
  createdAt: string;
};

/** Mirrors model CallLog. */
export type CallLog = {
  id: string;
  conversationId: string;
  status: CallStatus;
  startedAt: string;
  connectedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  messageId: string | null;
};

export type StartConversationInput = {
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string | null;
  hostName: string;
  hostAvatarUrl?: string | null;
  firstMessage?: string;
};

export type SendMessagePayload =
  | { type: "text"; body: string }
  | { type: "voice"; mediaUrl: string; mediaMimeType: string; mediaDurationSec: number; body?: string }
  | { type: "image"; mediaUrl: string; mediaMimeType: string; body?: string }
  | {
      type: "file";
      mediaUrl: string;
      mediaMimeType: string;
      fileName: string;
      fileSizeBytes: number;
      body?: string;
    };

export const messagesApi = {
  listConversations: (params?: { cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<{ items: ConversationSummary[]; nextCursor: string | null }>(`/conversations${suffix}`);
  },
  /** Find-or-create the thread for a listing, optionally sending an opening
   *  message in the same call (used by "Message Host" buttons). */
  startConversation: (input: StartConversationInput) => api.post<Conversation>("/conversations", input),
  getConversation: (id: string) => api.get<Conversation>(`/conversations/${id}`),
  listMessages: (id: string, params?: { cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<{ items: Message[]; nextCursor: string | null }>(`/conversations/${id}/messages${suffix}`);
  },
  sendMessage: (id: string, payload: SendMessagePayload) => api.post<Message>(`/conversations/${id}/messages`, payload),
  markRead: (id: string) => api.post<void>(`/conversations/${id}/read`),
};

export const callsApi = {
  start: (conversationId: string) => api.post<CallLog>(`/conversations/${conversationId}/calls`),
  end: (conversationId: string, callId: string) =>
    api.post<CallLog>(`/conversations/${conversationId}/calls/${callId}/end`),
};

/** ws(s)://host/ws/chat, derived from VITE_API_URL the same way api-client
 *  derives its base — kept here instead of api-client since it's chat-only. */
function chatSocketUrl(conversationId: string): string {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const wsBase = base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
  const { accessToken } = useBackendAuth.getState();
  const params = new URLSearchParams({ conversationId, token: accessToken ?? "" });
  return `${wsBase}/ws/chat?${params}`;
}

type ConversationSocketHandlers = {
  onMessage?: (message: Message) => void;
  /** Fired on every CallLog transition (ringing -> active -> ended/no_answer)
   *  so the call screen renders server time, not a client-guessed timer. */
  onCallEvent?: (call: CallLog) => void;
};

/** Opens a live socket for one conversation. Returns an unsubscribe fn.
 *  Reconnects with backoff so a dropped wifi connection doesn't silently
 *  stop delivering the simulated host replies (or call state). */
export function subscribeToConversation(conversationId: string, handlers: ConversationSocketHandlers): () => void {
  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let retryDelay = 1000;

  const connect = () => {
    socket = new WebSocket(chatSocketUrl(conversationId));
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.message) handlers.onMessage?.(data.message as Message);
        if (data.type === "call" && data.call) handlers.onCallEvent?.(data.call as CallLog);
      } catch {
        /* ignore malformed frames */
      }
    };
    socket.onopen = () => {
      retryDelay = 1000;
    };
    socket.onclose = () => {
      if (closedByCaller) return;
      setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    };
  };
  connect();

  return () => {
    closedByCaller = true;
    socket?.close();
  };
}
