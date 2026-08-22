import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

/** Tap-to-talk using the browser's native SpeechRecognition — real
 *  transcription, not a recorded blob shipped anywhere. Falls back to a
 *  friendly error if the browser doesn't support it (Safari/Firefox
 *  coverage is inconsistent). */
export function ConciergeVoiceInput({ onTranscript, onError, disabled }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const supported = useRef(getRecognitionCtor() != null);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const toggle = () => {
    if (disabled) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onError("Voice input isn't supported in this browser yet — try Chrome or Edge.");
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";

    recognition.onresult = (event: any) => {
      let text = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }
      onTranscript(text, isFinal);
    };
    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error === "no-speech" || event.error === "aborted") return;
      onError("Didn't catch that — check your microphone permission and try again.");
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  if (!supported.current) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Ask by voice"}
      className={cn(
        "relative shrink-0 p-2.5 rounded-full transition-all disabled:opacity-40",
        listening ? "bg-runway-red text-cloud-white" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {listening && <span className="absolute inset-0 rounded-full bg-runway-red/50 animate-ping" />}
      <Mic className="relative w-5 h-5" />
    </button>
  );
}
