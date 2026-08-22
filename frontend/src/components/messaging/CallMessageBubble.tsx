import { Phone, PhoneMissed } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/media-utils";
import type { CallStatus } from "@/lib/api/messages";

export function CallMessageBubble({
  status,
  durationSec,
  isUser,
  onCallBack,
}: {
  status: CallStatus | null;
  durationSec: number | null;
  isUser: boolean;
  onCallBack: () => void;
}) {
  const missed = status === "no_answer";
  return (
    <button
      type="button"
      onClick={onCallBack}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 transition-colors",
        isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
        missed && !isUser && "text-destructive",
      )}
    >
      {missed ? <PhoneMissed className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
      <span className="text-[14px] font-medium">
        {missed ? "No answer" : "Voice call"}
        {!missed && durationSec != null && (
          <span className={cn("ml-1.5 num tabular-nums", isUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {formatDuration(durationSec)}
          </span>
        )}
      </span>
    </button>
  );
}
