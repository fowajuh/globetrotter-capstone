import { useState } from "react";
import { toast } from "sonner";
import { Sheet } from "@/components/manifest/Sheet";
import { Button } from "@/components/ui/button";

export function FeedbackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    toast.success("Feedback sent — thank you for helping us improve.");
    setText("");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Send feedback">
      <div className="pt-1 space-y-4">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's working well, or what should we fix?"
          rows={5}
          className="w-full rounded-xl border border-ink-30/40 bg-cloud-white px-4 py-3 text-sm text-ink-90 outline-none focus:border-departure-navy transition-colors resize-none"
        />
        <Button onClick={submit} disabled={!text.trim()} className="w-full bg-departure-navy hover:bg-departure-navy/90 text-cloud-white">
          Send
        </Button>
      </div>
    </Sheet>
  );
}
