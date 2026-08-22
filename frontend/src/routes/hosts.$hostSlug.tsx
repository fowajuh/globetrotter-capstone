import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, Star, ShieldCheck, MessageSquare, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { getHostProfile } from "@/lib/host-utils";
import { messagesApi } from "@/lib/api/messages";
import { ListingCard } from "@/components/discover/ListingCard";

export const Route = createFileRoute("/hosts/$hostSlug")({
  loader: ({ params }) => {
    const profile = getHostProfile(params.hostSlug);
    if (!profile) throw notFound();
    return profile;
  },
  component: HostProfileScreen,
});

function HostProfileScreen() {
  const profile = Route.useLoaderData();
  const navigate = useNavigate();
  const primaryListing = profile.listings[0];

  const connectMutation = useMutation({
    mutationFn: () =>
      messagesApi.startConversation({
        listingId: primaryListing.id,
        listingTitle: primaryListing.title,
        listingImageUrl: primaryListing.images[0] ?? null,
        hostName: profile.name,
      }),
  });

  const handleMessage = () => {
    connectMutation.mutate(undefined, {
      onSuccess: (convo) => navigate({ to: "/inbox/$chatId", params: { chatId: convo.id } }),
    });
  };

  const handleCall = () => {
    connectMutation.mutate(undefined, {
      onSuccess: (convo) => navigate({ to: "/inbox/$chatId/call", params: { chatId: convo.id } }),
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="py-4 border-b border-border">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 flex items-center gap-3">
          <button onClick={() => navigate({ to: "/" })} className="w-9 h-9 -ml-1.5 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-xl">Host profile</h1>
        </div>
      </div>

      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 mt-8 space-y-10">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] bg-departure-navy text-cloud-white p-8 sm:p-10 relative overflow-hidden shadow-modal"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-beacon-amber/15 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <span className="font-display text-3xl">{profile.initials}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="font-display text-3xl">{profile.name}</h2>
                {profile.superhost && (
                  <span className="inline-flex items-center gap-1 bg-beacon-amber text-departure-navy text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Superhost
                  </span>
                )}
              </div>
              <p className="text-cloud-white/60 text-sm mt-1">Hosting in Cameroon since {profile.since}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 mt-5 num text-sm">
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-beacon-amber text-beacon-amber" /> {profile.avgRating.toFixed(2)} average
                </span>
                <span>{profile.totalReviews.toLocaleString()} reviews</span>
                <span>{profile.listings.length} {profile.listings.length === 1 ? "stay" : "stays"}</span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3">
                {profile.regions.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1 text-[11px] bg-white/10 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleMessage}
                disabled={connectMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-beacon-amber text-departure-navy font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-beacon-amber/90 transition-colors disabled:opacity-60"
              >
                <MessageSquare className="w-4 h-4" /> Message
              </button>
              <button
                onClick={handleCall}
                disabled={connectMutation.isPending}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white/10 text-cloud-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/20 transition-colors disabled:opacity-60"
              >
                <Phone className="w-4 h-4" /> Call
              </button>
            </div>
          </div>
        </motion.section>

        <section className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Identity verified", value: true },
            { label: "Response rate", value: "98%" },
            { label: "Response time", value: "within an hour" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
              {item.value === true ? (
                <CheckCircle2 className="w-5 h-5 text-horizon-teal shrink-0" />
              ) : (
                <span className="num font-semibold text-sm shrink-0">{item.value}</span>
              )}
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </section>

        <section>
          <h3 className="font-display text-xl mb-4">
            {profile.name.split(" ")[0]}'s {profile.listings.length === 1 ? "stay" : `${profile.listings.length} stays`}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profile.listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
