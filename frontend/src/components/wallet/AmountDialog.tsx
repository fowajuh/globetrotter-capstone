import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AmountDialog({
  open,
  onOpenChange,
  title,
  actionLabel,
  maxAmount,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actionLabel: string;
  maxAmount?: number;
  onConfirm: (amount: number) => void;
}) {
  const [value, setValue] = useState("");
  const amount = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(amount) && amount > 0 && (maxAmount == null || amount <= maxAmount);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onConfirm(amount);
    setValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) setValue(""); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              inputMode="decimal"
              className="w-full h-11 rounded-xl border border-border bg-background pl-7 pr-4 text-sm outline-none focus:border-departure-navy transition-colors num"
            />
          </div>
          {maxAmount != null && (
            <p className="text-xs text-muted-foreground">Available: ${maxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          )}
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={!valid} className="w-full bg-departure-navy hover:bg-departure-navy/90 text-cloud-white">
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
