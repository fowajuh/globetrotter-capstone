import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, computeWaveformPeaks } from "@/lib/media-utils";

type Props = {
  mediaUrl: string;
  durationSec: number;
  isUser: boolean;
  peaks?: number[];
};

const BAR_COUNT = 36;

export function VoiceMessageBubble({ mediaUrl, durationSec, isUser, peaks: initialPeaks }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [peaks, setPeaks] = useState<number[] | null>(initialPeaks ?? null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (peaks) return;
    let cancelled = false;
    fetch(mediaUrl)
      .then((r) => r.blob())
      .then((blob) => computeWaveformPeaks(blob, BAR_COUNT))
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch(() => {
        if (!cancelled) setPeaks(Array.from({ length: BAR_COUNT }, () => 0.4));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      const dur = audio.duration || durationSec || 1;
      setProgress(Math.min(1, audio.currentTime / dur));
      setElapsed(audio.currentTime);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setElapsed(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [durationSec]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const seekTo = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = audio.duration || durationSec;
    audio.currentTime = ratio * dur;
    setProgress(ratio);
  };

  const displaySeconds = playing || elapsed > 0 ? elapsed : durationSec;
  const bars = peaks ?? Array.from({ length: BAR_COUNT }, () => 0.3);
  const playedBars = Math.round(progress * bars.length);

  return (
    <div className="flex items-center gap-2 w-56">
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95",
          isUser ? "bg-primary-foreground/20" : "bg-primary/10",
        )}
      >
        {playing ? (
          <Pause className={cn("w-4 h-4", isUser ? "text-primary-foreground" : "text-primary")} fill="currentColor" />
        ) : (
          <Play className={cn("w-4 h-4 ml-0.5", isUser ? "text-primary-foreground" : "text-primary")} fill="currentColor" />
        )}
      </button>

      <button
        type="button"
        aria-label="Seek voice note"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekTo(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
        }}
        className="flex items-end gap-[2px] h-7 flex-1 min-w-0"
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn(
              "w-[2.5px] rounded-full shrink-0 transition-colors",
              i < playedBars
                ? isUser ? "bg-primary-foreground" : "bg-primary"
                : isUser ? "bg-primary-foreground/35" : "bg-primary/30",
            )}
            style={{ height: `${Math.max(15, h * 100)}%` }}
          />
        ))}
      </button>

      <span className={cn("num text-[11px] tabular-nums shrink-0", isUser ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {formatDuration(displaySeconds)}
      </span>
    </div>
  );
}
