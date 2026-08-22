import { useState } from "react";
import { Sheet } from "@/components/manifest/Sheet";
import { Button } from "@/components/ui/button";

export function EditBioSheet({
  open,
  onClose,
  bio,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  bio: string;
  onSave: (bio: string) => void;
}) {
  const [value, setValue] = useState(bio);

  return (
    <Sheet open={open} onClose={onClose} title="Edit intro">
      <div className="pt-1 space-y-4">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 280))}
          rows={5}
          className="w-full rounded-xl border border-ink-30/40 bg-cloud-white px-4 py-3 text-sm text-ink-90 outline-none focus:border-departure-navy transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-60">{value.length}/280</span>
          <Button
            onClick={() => {
              onSave(value.trim() || bio);
              onClose();
            }}
            className="bg-departure-navy hover:bg-departure-navy/90 text-cloud-white"
          >
            Save
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
