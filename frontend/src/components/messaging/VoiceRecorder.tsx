import { useEffect, useRef, useState } from "react";
import { Mic, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, computeWaveformPeaks } from "@/lib/media-utils";

const MAX_RECORD_SECONDS = 120;
const LIVE_BARS = 28;

type Props = {
  onSend: (payload: { blob: Blob; mimeType: string; durationSec: number; peaks: number[] }) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "";
}

/**
 * Tap-to-record voice notes. Deliberately click-driven (not press-and-hold)
 * — hold gestures are fragile across mouse/trackpad/touch and unreachable
 * by keyboard, and this app's audience is a web app first. Recording state
 * is unambiguous: red bar with a live level meter, then explicit
 * cancel (trash) or send (check).
 */
export function VoiceRecorder({ onSend, onError, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array(LIVE_BARS).fill(0.1));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    rafRef.current = null;
    timerRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    analyserRef.current = null;
  };

  useEffect(() => () => cleanup(), []);

  const tickLevels = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.floor(data.length / LIVE_BARS) || 1;
    const next: number[] = [];
    for (let i = 0; i < LIVE_BARS; i++) {
      next.push(Math.max(0.08, (data[i * step] ?? 0) / 255));
    }
    setLevels(next);
    rafRef.current = requestAnimationFrame(tickLevels);
  };

  const start = async () => {
    if (disabled || recording) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError("Voice notes need microphone access, which isn't available in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelledRef.current = false;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalMime = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        const durationSec = seconds;
        cleanup();
        setRecording(false);
        setSeconds(0);
        setLevels(Array(LIVE_BARS).fill(0.1));
        if (cancelledRef.current || durationSec < 1) return;
        computeWaveformPeaks(blob).then((peaks) => {
          onSend({ blob, mimeType: finalMime, durationSec, peaks });
        });
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      rafRef.current = requestAnimationFrame(tickLevels);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORD_SECONDS) {
            stop(false);
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      onError("Couldn't access your microphone. Check your browser's permission settings.");
    }
  };

  const stop = (cancelled: boolean) => {
    cancelledRef.current = cancelled;
    mediaRecorderRef.current?.stop();
  };

  if (!recording) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label="Record a voice note"
        className="p-2.5 text-muted-foreground hover:text-foreground disabled:opacity-40 shrink-0 transition-colors"
      >
        <Mic className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 animate-in fade-in slide-in-from-bottom-1 duration-150">
      <button
        type="button"
        onClick={() => stop(true)}
        aria-label="Cancel recording"
        className="p-2 text-muted-foreground hover:text-destructive shrink-0 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0 bg-background/60 rounded-full px-3 py-1.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
        </span>
        <div className="flex items-center gap-[2px] h-6 flex-1 min-w-0 overflow-hidden">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className="w-[2.5px] rounded-full bg-primary shrink-0"
              style={{ height: `${Math.max(15, lvl * 100)}%` }}
            />
          ))}
        </div>
        <span className="num text-xs text-muted-foreground tabular-nums shrink-0">{formatDuration(seconds)}</span>
      </div>

      <button
        type="button"
        onClick={() => stop(false)}
        aria-label="Send voice note"
        className={cn(
          "p-2.5 rounded-full shrink-0 transition-all hover:scale-105 active:scale-95",
          "bg-primary text-primary-foreground",
        )}
      >
        <Check className="w-4 h-4" />
      </button>
    </div>
  );
}
