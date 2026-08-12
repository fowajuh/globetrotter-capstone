export function PerforatedDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-1 px-2">
      <div className="flex-1 perforation-divider" />
      {label && (
        <span className="num text-[10px] uppercase tracking-[0.2em] text-ink-60 whitespace-nowrap">
          {label}
        </span>
      )}
      <div className="flex-1 perforation-divider" />
    </div>
  );
}
