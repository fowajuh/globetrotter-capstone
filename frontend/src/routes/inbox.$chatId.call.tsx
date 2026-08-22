import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Grid3x3, PhoneOff, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { messagesApi, callsApi, subscribeToConversation, type CallLog, type CallStatus } from "@/lib/api/messages";
import { formatDuration } from "@/lib/media-utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export const Route = createFileRoute("/inbox/$chatId/call")({
  component: CallScreen,
});

type Phase = "connecting" | "ringing" | "active" | "ended" | "no_answer";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function statusFromCall(status: CallStatus): Phase {
  if (status === "ringing") return "ringing";
  if (status === "active") return "active";
  return status; // "ended" | "no_answer"
}

function CallScreen() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();

  const conversationQuery = useQuery({
    queryKey: ["conversation", chatId],
    queryFn: () => messagesApi.getConversation(chatId),
  });
  const convo = conversationQuery.data;

  const [phase, setPhase] = useState<Phase>("connecting");
  const [callId, setCallId] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [dialed, setDialed] = useState("");

  const phaseRef = useRef(phase);
  const callIdRef = useRef<string | null>(null);
  const endedRef = useRef(false);
  phaseRef.current = phase;
  callIdRef.current = callId;

  const applyCall = (call: CallLog) => {
    setCallId(call.id);
    callIdRef.current = call.id;
    setPhase(statusFromCall(call.status));
    setConnectedAt(call.connectedAt ? new Date(call.connectedAt).getTime() : null);
  };

  // Start the call the moment the screen opens.
  const startMutation = useMutation({
    mutationFn: () => callsApi.start(chatId),
    onSuccess: applyCall,
    onError: () => setPhase("no_answer"),
  });
  useEffect(() => {
    startMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Live state: the server is the source of truth for when the "host"
  // picks up, so the ring duration and connect moment are never faked
  // client-side — see backend CallsService.
  useEffect(() => {
    const unsubscribe = subscribeToConversation(chatId, { onCallEvent: applyCall });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Live timer once connected.
  useEffect(() => {
    if (phase !== "active" || connectedAt == null) return;
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - connectedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, connectedAt]);

  // Terminal states auto-return to the thread after a beat.
  useEffect(() => {
    if (phase !== "ended" && phase !== "no_answer") return;
    endedRef.current = true;
    const id = setTimeout(() => {
      navigate({ to: "/inbox/$chatId", params: { chatId }, replace: true });
    }, 1400);
    return () => clearTimeout(id);
  }, [phase, chatId, navigate]);

  const endMutation = useMutation({
    mutationFn: () => callsApi.end(chatId, callIdRef.current!),
    onSuccess: applyCall,
  });

  const handleEnd = () => {
    if (!callIdRef.current || endedRef.current) return;
    endMutation.mutate();
  };

  // Best-effort hangup if the person navigates away mid-call (back gesture,
  // closing the tab) instead of pressing End — keeps the CallLog and chat
  // summary honest rather than leaving a call "ringing" forever.
  useEffect(() => {
    return () => {
      if (!endedRef.current && callIdRef.current && (phaseRef.current === "ringing" || phaseRef.current === "active")) {
        callsApi.end(chatId, callIdRef.current).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hostName = convo?.hostName ?? "Host";
  const canUseControls = phase === "ringing" || phase === "active";
  const statusLabel =
    phase === "connecting"
      ? "Calling…"
      : phase === "ringing"
        ? "Ringing…"
        : phase === "active"
          ? formatDuration(elapsed)
          : phase === "ended"
            ? "Call ended"
            : "No answer";

  return (
    <div className="flex flex-col h-[100dvh] bg-departure-navy text-cloud-white overflow-hidden relative">
      {/* Ambient texture, echoing the boarding-pass motif used elsewhere in the app */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative flex items-center justify-center mb-7">
          <AnimatePresence>
            {(phase === "connecting" || phase === "ringing") &&
              [0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full border border-beacon-amber/40"
                  initial={{ width: 112, height: 112, opacity: 0.6 }}
                  animate={{ width: 176, height: 176, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                />
              ))}
          </AnimatePresence>

          <div className="w-28 h-28 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            {convo?.hostAvatarUrl ? (
              <img src={convo.hostAvatarUrl} alt={hostName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-3xl text-cloud-white/90">{initials(hostName)}</span>
            )}
          </div>
        </div>

        <h1 className="font-display text-[28px] leading-tight text-center">{hostName}</h1>
        <p className={cn("num text-[15px] mt-2 tabular-nums", phase === "no_answer" ? "text-runway-red" : "text-cloud-white/70")}>
          {statusLabel}
        </p>
        {convo?.listingTitle && phase !== "active" && (
          <p className="text-xs text-cloud-white/40 mt-1 text-center max-w-[70vw] truncate">{convo.listingTitle}</p>
        )}
      </div>

      {/* Controls */}
      <div className="relative shrink-0 pb-safe pb-10 px-8">
        {canUseControls && (
          <div className="flex items-center justify-center gap-6 mb-9">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                muted ? "bg-cloud-white text-departure-navy" : "bg-white/10 text-cloud-white hover:bg-white/15",
              )}
            >
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => phase === "active" && setKeypadOpen(true)}
              disabled={phase !== "active"}
              aria-label="Open keypad"
              className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 text-cloud-white hover:bg-white/15 transition-colors disabled:opacity-30"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setSpeakerOn((s) => !s)}
              aria-label={speakerOn ? "Turn speaker off" : "Turn speaker on"}
              aria-pressed={speakerOn}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                speakerOn ? "bg-cloud-white text-departure-navy" : "bg-white/10 text-cloud-white hover:bg-white/15",
              )}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleEnd}
            disabled={!canUseControls}
            aria-label="End call"
            className="w-16 h-16 rounded-full bg-runway-red text-cloud-white flex items-center justify-center shadow-lg transition-transform active:scale-95 disabled:opacity-40"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>

      <Sheet open={keypadOpen} onOpenChange={setKeypadOpen}>
        <SheetContent side="bottom" className="bg-departure-navy text-cloud-white border-white/10 rounded-t-3xl">
          <SheetTitle className="text-cloud-white text-center text-base font-normal mb-1">
            {dialed || "\u00A0"}
          </SheetTitle>
          <div className="grid grid-cols-3 gap-3 py-4 max-w-xs mx-auto w-full">
            {KEYPAD_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDialed((d) => (d + key).slice(0, 24))}
                className="aspect-square rounded-full bg-white/10 hover:bg-white/15 text-xl font-display transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
          {dialed && (
            <button
              type="button"
              onClick={() => setDialed((d) => d.slice(0, -1))}
              aria-label="Delete digit"
              className="mx-auto flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/10 transition-colors"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
