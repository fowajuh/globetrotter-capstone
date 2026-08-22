import { Trash2, Check } from "lucide-react";
import { formatDuration } from "@/lib/media-utils";

export function VoiceRecordingBar({
  seconds,
  levels,
  onCancel,
  onSend,
}: {
  seconds: number;
  levels: number[];
  onCancel: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-1 duration-150">
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel recording"
        className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2.5 flex-1 min-w-0 bg-muted rounded-full px-4 h-11 border border-border">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <div className="flex items-center gap-[2.5px] h-6 flex-1 min-w-0 overflow-hidden">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-primary shrink-0"
              style={{ height: `${Math.max(15, lvl * 100)}%` }}
            />
          ))}
        </div>
        <span className="num text-xs text-muted-foreground tabular-nums shrink-0">{formatDuration(seconds)}</span>
      </div>

      <button
        type="button"
        onClick={onSend}
        aria-label="Send voice note"
        className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        <Check className="w-5 h-5" />
      </button>
    </div>
  );
}
