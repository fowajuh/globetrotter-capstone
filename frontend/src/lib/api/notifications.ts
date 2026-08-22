import { api } from "@/lib/api-client";

export type NotificationType = "message" | "call_missed" | "booking_confirmed" | string;

/** Mirrors model Notification — see backend/prisma/schema.prisma. */
export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  payloadJson: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export const notificationsApi = {
  list: (unreadOnly = false) => api.get<AppNotification[]>(`/notifications${unreadOnly ? "?unread=true" : ""}`),
  markRead: (id: string) => api.patch<{ count: number }>(`/notifications/${id}/read`),
};
