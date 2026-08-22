import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Send, Phone, Mic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  messagesApi,
  subscribeToConversation,
  type Message,
  type SendMessagePayload,
} from "@/lib/api/messages";
import { useVoiceRecorder } from "@/components/messaging/useVoiceRecorder";
import { VoiceRecordingBar } from "@/components/messaging/VoiceRecordingBar";
import { VoiceMessageBubble } from "@/components/messaging/VoiceMessageBubble";
import { ImageMessageBubble, FileMessageBubble } from "@/components/messaging/AttachmentMessageBubble";
import { CallMessageBubble } from "@/components/messaging/CallMessageBubble";
import { AttachmentPicker } from "@/components/messaging/AttachmentPicker";
import { readFileAsDataUrl, compressImageToDataUrl, assertUnderLimit, MediaTooLargeError } from "@/lib/media-utils";

export const Route = createFileRoute("/inbox/$chatId")({
  component: ChatScreen,
});

const MAX_FILE_MB = 10;
const MAX_IMAGE_SOURCE_MB = 25;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

/** Builds a full optimistic Message from a send payload so every field the
 *  bubble renderer expects exists immediately, before the server round-trip. */
function buildOptimisticMessage(chatId: string, payload: SendMessagePayload): Message {
  const base: Message = {
    id: `optimistic-${Date.now()}`,
    conversationId: chatId,
    senderId: null,
    senderRole: "user",
    type: payload.type,
    body: "body" in payload ? payload.body ?? "" : "",
    mediaUrl: null,
    mediaMimeType: null,
    mediaDurationSec: null,
    fileName: null,
    fileSizeBytes: null,
    callStatus: null,
    callDurationSec: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  };
  if (payload.type === "voice") {
    return { ...base, mediaUrl: payload.mediaUrl, mediaMimeType: payload.mediaMimeType, mediaDurationSec: payload.mediaDurationSec };
  }
  if (payload.type === "image") {
    return { ...base, mediaUrl: payload.mediaUrl, mediaMimeType: payload.mediaMimeType };
  }
  if (payload.type === "file") {
    return { ...base, mediaUrl: payload.mediaUrl, mediaMimeType: payload.mediaMimeType, fileName: payload.fileName, fileSizeBytes: payload.fileSizeBytes };
  }
  return base;
}

function ChatScreen() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
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

  // Live updates: the host's (simulated) replies and call state arrive over
  // this socket, and if the thread is open in two tabs both stay in sync.
  useEffect(() => {
    const unsubscribe = subscribeToConversation(chatId, {
      onMessage: (message) => {
        queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
          ["conversation", chatId, "messages"],
          (prev) => {
            if (!prev) return prev;
            if (prev.items.some((m) => m.id === message.id)) return prev;
            return { ...prev, items: [...prev.items, message] };
          },
        );
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      },
    });
    return unsubscribe;
  }, [chatId, queryClient]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (payload: SendMessagePayload) => messagesApi.sendMessage(chatId, payload),
    onMutate: async (payload: SendMessagePayload) => {
      setSending(true);
      const optimistic = buildOptimisticMessage(chatId, payload);
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => (prev ? { ...prev, items: [...prev.items, optimistic] } : prev),
      );
      return { optimisticId: optimistic.id };
    },
    onSuccess: (real, _payload, ctx) => {
      queryClient.setQueryData<{ items: Message[]; nextCursor: string | null } | undefined>(
        ["conversation", chatId, "messages"],
        (prev) => (prev ? { ...prev, items: prev.items.map((m) => (m.id === ctx?.optimisticId ? real : m)) } : prev),
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err, _payload, ctx) => {
      // Previously rolled back silently — the bubble would flash and
      // vanish with zero feedback, indistinguishable from "nothing
      // happened." Surface the real cause instead.
      console.error("Failed to send message:", err);
      toast.error(err instanceof Error ? err.message : "Message failed to send. Please try again.");
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
    sendMutation.mutate({ type: "text", body });
  };

  const handleSendVoice = ({
    blob,
    mimeType,
    durationSec,
  }: {
    blob: Blob;
    mimeType: string;
    durationSec: number;
    peaks: number[];
  }) => {
    readFileAsDataUrl(blob)
      .then((mediaUrl) => {
        sendMutation.mutate({ type: "voice", mediaUrl, mediaMimeType: mimeType, mediaDurationSec: durationSec });
      })
      .catch(() => toast.error("Couldn't process that voice note. Try again."));
  };

  const handlePickImage = async (file: File) => {
    try {
      assertUnderLimit(file.size, MAX_IMAGE_SOURCE_MB);
      const { dataUrl, mimeType } = await compressImageToDataUrl(file);
      sendMutation.mutate({ type: "image", mediaUrl: dataUrl, mediaMimeType: mimeType });
    } catch (err) {
      toast.error(err instanceof MediaTooLargeError ? err.message : "Couldn't send that photo. Try a different one.");
    }
  };

  const handlePickFile = async (file: File) => {
    try {
      assertUnderLimit(file.size, MAX_FILE_MB);
      const mediaUrl = await readFileAsDataUrl(file);
      sendMutation.mutate({
        type: "file",
        mediaUrl,
        mediaMimeType: file.type || "application/octet-stream",
        fileName: file.name,
        fileSizeBytes: file.size,
      });
    } catch (err) {
      toast.error(err instanceof MediaTooLargeError ? `That file is over ${MAX_FILE_MB}MB.` : "Couldn't send that file. Try again.");
    }
  };

  const goToCallScreen = () => navigate({ to: "/inbox/$chatId/call", params: { chatId } });

  const voice = useVoiceRecorder({ onSend: handleSendVoice, onError: (msg) => toast.error(msg) });

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
          <button
            onClick={goToCallScreen}
            disabled={!convo}
            aria-label={`Call ${convo?.hostName ?? "host"}`}
            className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Phone className="w-5 h-5" />
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
          // Defensive: if the deployed backend predates this schema (or a
          // future type we don't know about yet), `type` can be missing or
          // unrecognized. Never let that render a blank bubble — text with
          // whatever body we have beats an invisible message.
          const kind = msg.type === "voice" || msg.type === "image" || msg.type === "file" || msg.type === "call" ? msg.type : "text";

          if (kind === "call") {
            return (
              <div key={msg.id} className={cn("flex flex-col", isUser ? "self-end items-end" : "self-start items-start")}>
                <CallMessageBubble status={msg.callStatus} durationSec={msg.callDurationSec} isUser={isUser} onCallBack={goToCallScreen} />
                <span className="text-[10px] text-muted-foreground mt-1 mx-1">{formatTime(msg.createdAt)}</span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isUser ? "self-end items-end" : "self-start items-start")}>
              <div
                className={cn(
                  "rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  kind === "text" && "px-4 py-2.5",
                  kind === "voice" && "px-3 py-2.5",
                  kind === "image" && "p-1",
                  kind === "file" && "p-1.5",
                  isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {kind === "voice" && msg.mediaUrl ? (
                  <VoiceMessageBubble mediaUrl={msg.mediaUrl} durationSec={msg.mediaDurationSec ?? 0} isUser={isUser} />
                ) : kind === "image" && msg.mediaUrl ? (
                  <ImageMessageBubble mediaUrl={msg.mediaUrl} />
                ) : kind === "file" && msg.mediaUrl && msg.fileName ? (
                  <FileMessageBubble
                    mediaUrl={msg.mediaUrl}
                    fileName={msg.fileName}
                    fileSizeBytes={msg.fileSizeBytes}
                    mediaMimeType={msg.mediaMimeType}
                    isUser={isUser}
                  />
                ) : (
                  msg.body || <span className="opacity-60 italic">Empty message</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 mx-1">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </main>

      {/* Input Area */}
      <footer className="px-3 py-3 bg-background border-t border-border shrink-0">
        {voice.recording ? (
          <VoiceRecordingBar seconds={voice.seconds} levels={voice.levels} onCancel={voice.cancel} onSend={voice.stop} />
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 flex-1 min-w-0 bg-muted rounded-full pl-1.5 pr-1 h-11 border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <AttachmentPicker onPickImage={handlePickImage} onPickFile={handlePickFile} disabled={sending} />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] min-w-0 h-full"
              />
            </div>
            {inputText.trim() ? (
              <button
                type="submit"
                disabled={sending}
                aria-label="Send message"
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
              >
                <Send className="w-[18px] h-[18px]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={voice.start}
                disabled={sending}
                aria-label="Record a voice note"
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
              >
                <Mic className="w-[18px] h-[18px]" />
              </button>
            )}
          </form>
        )}
      </footer>
    </div>
  );
}
