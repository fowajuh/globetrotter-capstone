import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/manifest/Sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RateAppSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);

  const submit = () => {
    if (rating === 0) return;
    toast.success(rating >= 4 ? "Thanks for the love! ✈️" : "Thanks — we'll use this to improve.");
    onClose();
    setTimeout(() => setRating(0), 300);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Rate GlobeTrotter">
      <div className="pt-2 pb-1 text-center space-y-5">
        <p className="text-sm text-ink-60">How's your experience been so far?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-1"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  (hovered || rating) >= n ? "fill-beacon-amber text-beacon-amber" : "text-ink-30",
                )}
              />
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={rating === 0} className="w-full bg-departure-navy hover:bg-departure-navy/90 text-cloud-white">
          Submit
        </Button>
      </div>
    </Sheet>
  );
}
