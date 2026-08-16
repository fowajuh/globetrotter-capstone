import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useBackendAuth } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api/messages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox/")({
  component: InboxScreen,
});

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function InboxScreen() {
  const { accessToken } = useBackendAuth();
  const isSignedIn = !!accessToken;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!isSignedIn) {
      navigate({ to: "/login" });
    }
  }, [isSignedIn, navigate]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations({ limit: 50 }),
    enabled: isSignedIn,
    // Cheap way to notice new messages/host replies without a socket on
    // this screen; the thread itself uses a live socket for real-time.
    refetchInterval: 15000,
  });

  const chats = data?.items ?? [];
  const visibleChats = filter === "unread" ? chats.filter((c) => c.unreadCount > 0) : chats;

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-4 px-4 sm:px-6 flex justify-between items-center max-w-screen-md mx-auto">
        <h1 className="text-3xl font-bold font-display">Messages</h1>
      </div>

      <main className="max-w-screen-md mx-auto px-4 sm:px-6 mt-4">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              filter === "all" ? "bg-foreground text-background" : "border border-border text-foreground hover:border-foreground"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
              filter === "unread" ? "bg-foreground text-background" : "border border-border text-foreground hover:border-foreground"
            )}
          >
            Unread
          </button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 bg-muted rounded" />
                  <div className="h-3 w-40 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16">
            <p className="font-semibold">Couldn't load your messages</p>
            <p className="text-muted-foreground text-sm mt-1">Check your connection and try again.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-2">
            {visibleChats.map((chat) => (
              <Link
                key={chat.id}
                to="/inbox/$chatId"
                params={{ chatId: chat.id }}
                className="flex items-start gap-4 p-4 hover:bg-muted rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.hostAvatarUrl ?? chat.listingImageUrl ?? "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80"}
                    alt={chat.hostName}
                    className="w-14 h-14 rounded-full object-cover border border-border"
                  />
                  {chat.unreadCount > 0 && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-primary border-2 border-background rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-semibold text-base truncate ${chat.unreadCount > 0 ? "text-foreground" : "text-foreground/90"}`}>
                      {chat.hostName}
                    </h3>
                    <span className={`text-xs whitespace-nowrap ml-2 ${chat.unreadCount > 0 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {timeAgo(chat.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 truncate mb-1">
                    {chat.listingTitle}
                  </p>
                  <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {chat.lastMessage ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            ))}
            {visibleChats.length === 0 && (
              <div className="text-center py-16">
                <p className="font-semibold">{filter === "unread" ? "No unread messages" : "No messages yet"}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {filter === "unread" ? "You're all caught up." : "Message a host from any stay to start a conversation."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
