import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Send, Phone, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { messagesApi, subscribeToConversation, type Message } from "@/lib/api/messages";

export const Route = createFileRoute("/inbox/$chatId")({
  component: ChatScreen,
});

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function ChatScreen() {
  const { chatId } = Route.useParams();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversationQuery = useQuery({
    queryKey: ["conversation", chatId],
    queryFn: () => messagesApi.getConversation(chatId),
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation", chatId, "messages"],
    queryFn: () => messagesApi.listMessages(chatId, { limit: 50 }),
  });

  const messages = messagesQuery.data?.items ?? [];

  // Live updates: the host's (simulated) replies arrive over this socket,
  // and if the thread is open in two tabs both stay in sync.
  useEffect(() => {
    const unsubscribe = subscribeToConversation(chatId, (message: Message) => {
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => {
          if (!prev) return prev;
          if (prev.items.some((m) => m.id === message.id)) return prev;
          return { ...prev, items: [...prev.items, message] };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
    return unsubscribe;
  }, [chatId, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => messagesApi.sendMessage(chatId, body),
    onMutate: async (body: string) => {
      setSending(true);
      setSendError(null);
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId: chatId,
        senderId: null,
        senderRole: "user",
        body,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => (prev ? { ...prev, items: [...prev.items, optimistic] } : prev),
      );
      return { optimisticId: optimistic.id };
    },
    onSuccess: (real, _body, ctx) => {
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => (prev ? { ...prev, items: prev.items.map((m) => (m.id === ctx?.optimisticId ? real : m)) } : prev),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err, _body, ctx) => {
      // Previously rolled back silently — the bubble would flash and
      // vanish with zero feedback, indistinguishable from "nothing
      // happened." Surface the real cause instead.
      console.error("Failed to send message:", err);
      setSendError(err instanceof Error ? err.message : "Message failed to send. Please try again.");
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => (prev ? { ...prev, items: prev.items.filter((m) => m.id !== ctx?.optimisticId) } : prev),
      );
    },
    onSettled: () => setSending(false),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = inputText.trim();
    if (!body) return;
    setInputText("");
    sendMutation.mutate(body);
  };

  const convo = conversationQuery.data;
  const dayLabel = messages[0] ? formatDayLabel(messages[0].createdAt) : null;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border flex justify-between items-center px-4 py-3 shrink-0">
        <Link to="/inbox" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center min-w-0">
          <span className="font-semibold text-[15px] truncate max-w-[60vw]">
            {convo?.hostName ?? (conversationQuery.isLoading ? "Loading…" : "Host")}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[60vw]">
            {convo?.listingTitle ?? ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-muted transition-colors" disabled title="Calling isn't available yet">
            <Phone className="w-5 h-5 opacity-40" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {conversationQuery.isError && (
          <div className="text-center text-sm text-muted-foreground py-10">
            This conversation couldn't be found.
          </div>
        )}

        {messagesQuery.isLoading && (
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={cn("h-10 rounded-2xl bg-muted animate-pulse", i % 2 ? "w-40 self-end" : "w-52 self-start")} />
            ))}
          </div>
        )}

        {!messagesQuery.isLoading && dayLabel && (
          <div className="text-center text-xs text-muted-foreground my-2">{dayLabel}</div>
        )}

        {!messagesQuery.isLoading && messages.length === 0 && !messagesQuery.isError && (
          <div className="text-center text-sm text-muted-foreground py-10">
            Say hello — your message goes straight to {convo?.hostName ?? "the host"}.
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.senderRole === "user";
          return (
            <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isUser ? "self-end items-end" : "self-start items-start")}>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-[15px]",
                isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {msg.body}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 mx-1">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-background border-t border-border shrink-0">
        {sendError && (
          <p className="text-xs text-destructive text-center mb-2">{sendError}</p>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-muted p-2 rounded-3xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <div className="p-2 text-muted-foreground/40 shrink-0" title="Attachments aren't available yet">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none max-h-32 py-2.5 text-[15px]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
}
