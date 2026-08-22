import { Check } from "lucide-react";
import { Sheet } from "@/components/manifest/Sheet";

export function PickerSheet({
  open,
  onClose,
  title,
  options,
  value,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-1 pt-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onSelect(opt.value);
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-runway-sand transition-colors text-left"
          >
            <span className="text-sm text-ink-90">{opt.label}</span>
            {value === opt.value && <Check className="w-4 h-4 text-departure-navy" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
