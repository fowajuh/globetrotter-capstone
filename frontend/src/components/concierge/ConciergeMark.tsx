import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The concierge's identity mark. Deliberately not a purple/pink/orange
 * gradient sparkle-orb — that's the single most recognizable "generic AI
 * chatbot" tell. Uses the app's own boarding-pass palette (departure-navy +
 * beacon-amber) so it reads as a GlobeTrotter feature, not a bolted-on
 * assistant widget.
 */
export function ConciergeMark({ size = "md", thinking = false }: { size?: "sm" | "md"; thinking?: boolean }) {
  const dims = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconDims = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  return (
    <div className={cn("relative shrink-0", dims)}>
      {thinking && (
        <span className="absolute inset-0 rounded-full bg-beacon-amber/50 animate-ping" style={{ animationDuration: "1.6s" }} />
      )}
      <div
        className={cn(
          "relative rounded-full bg-departure-navy ring-1 ring-beacon-amber/50 flex items-center justify-center",
          dims,
        )}
      >
        <Compass className={cn(iconDims, "text-beacon-amber")} strokeWidth={1.75} />
      </div>
    </div>
  );
}
