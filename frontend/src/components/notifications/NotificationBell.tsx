import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageSquare, PhoneMissed, CalendarCheck, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notificationsApi, type AppNotification } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function describe(n: AppNotification): { icon: typeof Bell; title: string; body: string; to?: string; params?: Record<string, string> } {
  const p = n.payloadJson as Record<string, string | undefined>;
  switch (n.type) {
    case "message":
      return {
        icon: MessageSquare,
        title: p.hostName ? `${p.hostName} sent a message` : "New message",
        body: p.preview ?? p.listingTitle ?? "",
        to: "/inbox/$chatId",
        params: { chatId: p.conversationId ?? "" },
      };
    case "call_missed":
      return {
        icon: PhoneMissed,
        title: p.hostName ? `Missed call from ${p.hostName}` : "Missed call",
        body: "Tap to call back",
        to: "/inbox/$chatId",
        params: { chatId: p.conversationId ?? "" },
      };
    case "booking_confirmed":
      return {
        icon: CalendarCheck,
        title: "Booking confirmed",
        body: p.listingTitle ?? "",
        to: "/trips",
      };
    default:
      return { icon: Sparkles, title: "Update", body: "" };
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 20000,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      queryClient.setQueryData<AppNotification[] | undefined>(["notifications"], (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    },
  });

  const items = notificationsQuery.data ?? [];
  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-runway-red text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[70vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-display text-sm">Notifications</h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10 px-4">
            {notificationsQuery.isError ? "Couldn't load notifications." : "You're all caught up."}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((n) => {
              const { icon: Icon, title, body, to, params } = describe(n);
              const unread = !n.readAt;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (unread) markRead.mutate(n.id);
                    setOpen(false);
                    if (to) navigate({ to, params: params as any });
                  }}
                  className={cn("w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors", unread && "bg-departure-navy/[0.03]")}
                >
                  <span className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", unread ? "bg-departure-navy text-cloud-white" : "bg-muted text-muted-foreground")}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-[13px] truncate", unread ? "font-semibold" : "font-medium text-muted-foreground")}>{title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(n.createdAt)}</span>
                    </span>
                    {body && <span className="block text-xs text-muted-foreground truncate mt-0.5">{body}</span>}
                  </span>
                  {unread && <span className="w-1.5 h-1.5 rounded-full bg-beacon-amber shrink-0 mt-2" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
