import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm bg-runway-sand/70",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[manifest-sweep_1.4s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-cloud-white/60 after:to-transparent",
        className,
      )}
    />
  );
}

export function StubSkeleton() {
  return (
    <div className="ticket-stub rounded-sm space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
