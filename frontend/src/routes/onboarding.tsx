import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Globe } from "@/components/manifest/Globe";
import { useUI } from "@/lib/store";
import { SignUp, useUser } from "@clerk/clerk-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome aboard · GlobeTrotter" },
      { name: "description", content: "Four questions and your first manifest is ready to write." },
      { property: "og:title", content: "Welcome aboard · GlobeTrotter" },
      { property: "og:description", content: "Tell us how you travel and we'll draft the manifest." },
    ],
  }),
  component: Onboarding,
});

const REGIONS = [
  { label: "Japan", lat: 35, lng: 135.8 },
  { label: "Peru", lat: -13.2, lng: -72.5 },
  { label: "Iceland", lat: 64.1, lng: -21.8 },
  { label: "Morocco", lat: 31.6, lng: -8 },
  { label: "Portugal", lat: 38.7, lng: -9.1 },
  { label: "Vietnam", lat: 21, lng: 105.8 },
];

const STEPS = [
  { kicker: "Segment 01", title: "Where do you dream of going?", hint: "Tap a region — the globe will tilt to it." },
  { kicker: "Segment 02", title: "How do you travel?", hint: "Manifest lines get written differently for each." },
  { kicker: "Segment 03", title: "Budget style", hint: "Sets the default fare class on your stubs." },
  { kicker: "Segment 04", title: "Departure alerts", hint: "Boarding reminders, price drops, collaborator notes." },
];

const OPTIONS: string[][] = [
  REGIONS.map((r) => r.label),
  ["Solo", "Partner", "Family", "Friends"],
  ["Shoestring", "Comfort", "Luxury"],
  ["Enable alerts", "Not right now"],
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<(string | null)[]>([null, null, null, null]);
  const [tilt, setTilt] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();
  const setOnboarded = useUI((s) => s.setOnboarded);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && step === 4) {
      setOnboarded(true);
      navigate({ to: "/" });
    }
  }, [isLoaded, isSignedIn, step, navigate, setOnboarded]);

  const finish = () => {
    if (isSignedIn) {
      setOnboarded(true);
      navigate({ to: "/" });
    } else {
      setStep(4); // Move to auth step
    }
  };

  const choose = (value: string) => {
    setPicked((p) => p.map((v, i) => (i === step ? value : v)));
    if (step === 0) {
      const r = REGIONS.find((x) => x.label === value);
      if (r) setTilt({ lat: r.lat, lng: r.lng });
    }
  };

  const advance = () => (step < 3 ? setStep((s) => s + 1) : finish());

  return (
    <div className="relative min-h-screen bg-departure-navy text-cloud-white overflow-hidden">
      <Globe tiltTo={tilt} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-departure-navy/70 via-departure-navy/40 to-departure-navy" />

      <div className="relative flex min-h-screen flex-col max-w-xl mx-auto px-6 pt-8 pb-10">
        {step < 4 && (
          <div className="flex gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={4}>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.kicker}
                animate={{
                  opacity: i < step ? 0.25 : 1,
                  rotate: i < step ? -6 : 0,
                  y: i < step ? 6 : 0,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`flex-1 h-8 rounded-sm border border-dashed flex items-center justify-center num text-[9px] uppercase tracking-[0.2em] ${
                  i === step ? "border-beacon-amber text-beacon-amber" : "border-cloud-white/30 text-cloud-white/50"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          drag={step < 4 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 && step < 3) setStep((s) => s + 1);
            if (info.offset.x > 80 && step > 0) setStep((s) => s - 1);
          }}
          className="flex-1 flex flex-col justify-center cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            {step < 4 ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="num text-[11px] uppercase tracking-[0.24em] text-beacon-amber">
                  {STEPS[step].kicker}
                </p>
                <h1 className="font-display text-4xl md:text-5xl leading-[0.95] mt-2">
                  {STEPS[step].title}
                </h1>
                <p className="text-sm text-cloud-white/70 mt-2">{STEPS[step].hint}</p>

                <div className="flex flex-wrap gap-2 mt-7">
                  {OPTIONS[step].map((opt) => {
                    const active = picked[step] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => choose(opt)}
                        className={`num text-[11px] uppercase tracking-[0.18em] px-4 py-2.5 rounded-sm border transition-colors ${
                          active
                            ? "bg-beacon-amber text-departure-navy border-beacon-amber"
                            : "border-cloud-white/30 text-cloud-white/80 hover:border-cloud-white/70"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center justify-center"
              >
                <p className="num text-[11px] uppercase tracking-[0.24em] text-beacon-amber mb-4 text-center">
                  Final Step
                </p>
                <h1 className="font-display text-3xl md:text-4xl leading-[0.95] mb-8 text-center">
                  Secure your manifest
                </h1>
                <SignUp fallbackRedirectUrl="/" signInFallbackRedirectUrl="/" routing="hash" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {step < 4 && (
          <div className="flex items-center justify-between">
            <button onClick={finish} className="text-xs text-cloud-white/45 hover:text-cloud-white/80 transition-colors">
              Skip
            </button>
            <button
              onClick={advance}
              disabled={!picked[step]}
              className="inline-flex items-center gap-2 num text-[11px] uppercase tracking-[0.2em] bg-beacon-amber text-departure-navy px-5 py-3 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Board now" : "Next segment"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
