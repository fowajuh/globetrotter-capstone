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

/** Mirrors model Message. senderRole "host" is server-simulated for now —
 *  there's no separate host account system yet (see MessagesService). */
export type Message = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderRole: "user" | "host";
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type StartConversationInput = {
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string | null;
  hostName: string;
  hostAvatarUrl?: string | null;
  firstMessage?: string;
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
  sendMessage: (id: string, body: string) => api.post<Message>(`/conversations/${id}/messages`, { body }),
  markRead: (id: string) => api.post<void>(`/conversations/${id}/read`),
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

/** Opens a live socket for one conversation. Returns an unsubscribe fn.
 *  Reconnects with backoff so a dropped wifi connection doesn't silently
 *  stop delivering the simulated host replies. */
export function subscribeToConversation(conversationId: string, onMessage: (message: Message) => void): () => void {
  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let retryDelay = 1000;

  const connect = () => {
    socket = new WebSocket(chatSocketUrl(conversationId));
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.message) onMessage(data.message as Message);
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
