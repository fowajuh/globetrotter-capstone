import { useState } from "react";
import { CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { detectCardBrand, type SavedCard } from "@/lib/payments-store";

function formatCardNumber(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const clean = val.replace(/\D/g, "").slice(0, 4);
  return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
}

export function AddCardDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (card: Omit<SavedCard, "id">) => void;
}) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [name, setName] = useState("");

  const digits = number.replace(/\D/g, "");
  const valid = digits.length >= 12 && /^\d{2}\/\d{2}$/.test(expiry) && name.trim().length > 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const [mm, yy] = expiry.split("/");
    onAdd({
      brand: detectCardBrand(digits),
      last4: digits.slice(-4),
      expMonth: Number(mm),
      expYear: Number(yy),
      holderName: name.trim(),
    });
    setNumber("");
    setExpiry("");
    setName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Add a card</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <input
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              placeholder="Card number"
              inputMode="numeric"
              className="w-full h-11 rounded-xl border border-border bg-background px-4 pr-10 text-sm outline-none focus:border-departure-navy transition-colors"
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex gap-3">
            <input
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              inputMode="numeric"
              className="w-24 h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-departure-navy transition-colors"
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name on card"
              className="flex-1 h-11 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-departure-navy transition-colors"
            />
          </div>
          <DialogFooter className="pt-1">
            <Button type="submit" disabled={!valid} className="w-full bg-departure-navy hover:bg-departure-navy/90 text-cloud-white">
              Save card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
