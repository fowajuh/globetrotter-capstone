import { useEffect, useRef, useState } from "react";
import { computeWaveformPeaks } from "@/lib/media-utils";

const MAX_RECORD_SECONDS = 120;
const LIVE_BARS = 28;

export type VoiceRecorderSendPayload = { blob: Blob; mimeType: string; durationSec: number; peaks: number[] };

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
 * by keyboard. Split out of the UI so the idle trigger can live as a small
 * circular button outside the composer pill while the active recording bar
 * takes over the full composer width — matching a native chat app's layout
 * instead of squeezing both states into one fixed-size slot.
 */
export function useVoiceRecorder({
  onSend,
  onError,
}: {
  onSend: (payload: VoiceRecorderSendPayload) => void;
  onError: (message: string) => void;
}) {
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
  const secondsRef = useRef(0);

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
    if (recording) return;
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
        const durationSec = secondsRef.current;
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
      secondsRef.current = 0;
      rafRef.current = requestAnimationFrame(tickLevels);
      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_RECORD_SECONDS) stop(false);
      }, 1000);
    } catch {
      onError("Couldn't access your microphone. Check your browser's permission settings.");
    }
  };

  const stop = (cancelled: boolean) => {
    cancelledRef.current = cancelled;
    mediaRecorderRef.current?.stop();
  };

  return { recording, seconds, levels, start, stop: () => stop(false), cancel: () => stop(true) };
}
