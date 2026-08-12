import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value,
  size = 14,
  className,
  interactive,
  onChange,
}: {
  value: number;
  size?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i - 0.25;
        const star = (
          <Star
            width={size}
            height={size}
            strokeWidth={1.75}
            className={filled ? "fill-beacon-amber text-beacon-amber" : "text-ink-30"}
          />
        );
        return interactive ? (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange?.(i)}
            className="transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </span>
  );
}
