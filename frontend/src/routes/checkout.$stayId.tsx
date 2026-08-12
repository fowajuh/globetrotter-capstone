import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Lock, CreditCard, Star, Wifi, Coffee, Shield, CheckCircle, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { getListing, type Listing } from "@/lib/cameroon-data";
import { useTravel } from "@/lib/travel-store";
import { tripsApi } from "@/lib/api/trips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/$stayId")({
  loader: ({ params }): Listing => {
    const listing = getListing(params.stayId);
    if (!listing) throw new Error("Listing not found");
    return listing;
  },
  component: CheckoutScreen,
});

function CheckoutScreen() {
  const listing = Route.useLoaderData() as Listing;
  const navigate = useNavigate();
  const { addBooking, pendingBooking } = useTravel();

  // Falls back to a default 5-night stay if the person landed here directly
  // (e.g. a bookmarked link) rather than via the stay page's date picker.
  const fallbackCheckin = "2026-12-01";
  const fallbackCheckout = "2026-12-06";
  const checkinIso = pendingBooking?.listingId === listing.id ? pendingBooking.checkin : fallbackCheckin;
  const checkoutIso = pendingBooking?.listingId === listing.id ? pendingBooking.checkout : fallbackCheckout;
  const guests = pendingBooking?.listingId === listing.id ? pendingBooking.guests : 2;

  const nights = Math.max(1, Math.round((new Date(checkoutIso).getTime() - new Date(checkinIso).getTime()) / 86400000));
  const pricePerNight = listing.usd;
  const subtotal = pricePerNight * nights;
  const cleaningFee = 45;
  const serviceFee = Math.round(subtotal * 0.14);
  const total = subtotal + cleaningFee + serviceFee;

  const checkin = new Date(checkinIso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const checkout = new Date(checkoutIso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "wallet">("card");

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card" && (!cardNumber || !expiry || !cvv || !name)) return;
    setIsProcessing(true);
    setBookingError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // addBooking still records the local wallet transaction/budget
      // ledger (that subsystem isn't backend-wired yet), but the trip
      // itself now has to exist for real: this used to navigate to the
      // id addBooking made up locally, which the (now backend-wired)
      // trip detail page could never find — a guaranteed 404 on every
      // single booking. Create the real trip first and navigate to that.
      addBooking(listing, checkinIso, checkoutIso, guests, total);
      const trip = await tripsApi.create({
        name: `${listing.city} trip`,
        subtitle: listing.title,
        coverPhotoUrl: listing.images[0] ?? null,
        destinationCode: listing.city,
        startDate: checkinIso,
        endDate: checkoutIso,
        budgetPlanned: total,
      });

      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#FF385C", "#222222", "#ffffff"] });
      navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
    } catch (err) {
      setIsProcessing(false);
      setBookingError(err instanceof Error ? err.message : "Something went wrong confirming your booking. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-4 flex items-center gap-4">
        <Link to={`/stays/${listing.id}`} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Confirm and pay</h1>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pt-6 lg:grid lg:grid-cols-[1fr_420px] lg:gap-12">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Your Trip Summary */}
          <section>
            <h2 className="text-xl font-bold mb-4">Your trip</h2>
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Dates</p>
                  <p className="text-muted-foreground text-sm">{checkin} – {checkout}</p>
                </div>
                <button
                  onClick={() => navigate({ to: "/stays/$stayId", params: { stayId: listing.id }, hash: "book" })}
                  className="text-sm font-semibold underline"
                >
                  Edit
                </button>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Guests</p>
                  <p className="text-muted-foreground text-sm">{guests} guest{guests > 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={() => navigate({ to: "/stays/$stayId", params: { stayId: listing.id }, hash: "book" })}
                  className="text-sm font-semibold underline"
                >
                  Edit
                </button>
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section>
            <h2 className="text-xl font-bold mb-4">Choose how to pay</h2>
            <div className="space-y-3">
              {(["card", "paypal", "wallet"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                    paymentMethod === method ? "border-foreground bg-muted/50" : "border-border hover:border-foreground/50"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors", paymentMethod === method ? "border-foreground" : "border-border")}>
                    {paymentMethod === method && <div className="w-2 h-2 bg-foreground rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">
                      {method === "card" ? "Credit or debit card" : method === "paypal" ? "PayPal" : "GlobeTrotter Wallet"}
                    </p>
                    {method === "wallet" && <p className="text-sm text-muted-foreground">Balance: $2,450.00</p>}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Card Form */}
          {paymentMethod === "card" && (
            <section>
              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full border border-border rounded-xl px-4 py-3.5 pr-12 text-sm outline-none focus:border-foreground transition-colors"
                  />
                  <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="border border-border rounded-xl px-4 py-3.5 text-sm outline-none focus:border-foreground transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    maxLength={3}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="border border-border rounded-xl px-4 py-3.5 text-sm outline-none focus:border-foreground transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Name on card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border rounded-xl px-4 py-3.5 text-sm outline-none focus:border-foreground transition-colors"
                />

                {/* Policies */}
                <div className="bg-card border border-border rounded-2xl p-4 text-sm space-y-3">
                  <div className="flex gap-3 items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p className="text-muted-foreground"><span className="text-foreground font-medium">Free cancellation</span> before Dec 1. Cancel before check-in on Dec 1 for a partial refund.</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">Your payment is encrypted and protected by SSL.</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">By selecting the button below, I agree to the Host's House Rules, GlobeTrotter's Rebooking and Refund Policy, and that GlobeTrotter can charge my payment method if I'm responsible for damage.</p>

                {bookingError && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 transition-opacity"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Confirm and pay · $${total.toLocaleString()}`
                  )}
                </Button>
              </form>
            </section>
          )}
          {paymentMethod !== "card" && (
            <>
              {bookingError && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
              <Button
                onClick={handleConfirm as any}
                className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 transition-opacity"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm and pay · $${total.toLocaleString()}`
                )}
              </Button>
            </>
          )}
        </div>

        {/* Right Column — Price Summary */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-[76px] bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex gap-4 mb-5">
              <img src={listing.images[0]} alt={listing.title} className="w-24 h-20 rounded-xl object-cover" />
              <div>
                <p className="text-sm font-semibold leading-tight">{listing.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3.5 h-3.5 fill-foreground" />
                  <span className="text-sm font-semibold">{listing.rating.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">({listing.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border mb-4" />

            <h3 className="font-bold text-base mb-4">Price details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="underline">${pricePerNight} x {nights} nights</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">Cleaning fee</span>
                <span>${cleaningFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="underline">GlobeTrotter service fee</span>
                <span>${serviceFee}</span>
              </div>
            </div>

            <div className="h-px bg-border my-4" />
            <div className="flex justify-between font-bold text-base">
              <span>Total (USD)</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
