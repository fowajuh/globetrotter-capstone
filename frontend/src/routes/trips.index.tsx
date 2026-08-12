import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, DollarSign, Users, ChevronRight, Plus, Plane } from "lucide-react";
import { tripsApi, backendTripToUiTrip } from "@/lib/api/trips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trips/")({
  component: TripsDashboard,
});

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-emerald-100 text-emerald-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-muted text-muted-foreground",
};

function TripsDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["trips"],
    queryFn: () => tripsApi.list({ limit: 50 }),
  });

  const myTrips = (data?.items ?? []).map(backendTripToUiTrip);

  const upcoming = myTrips.filter(t => t.status === "upcoming" || t.status === "active");
  const past = myTrips.filter(t => t.status === "past");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-muted border-t-accent animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center text-center px-4">
        <p className="text-muted-foreground">Couldn't load your trips. Is the backend running?</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="py-6 px-4 sm:px-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Trips</h1>
            <p className="text-muted-foreground mt-1">Your travel history &amp; upcoming adventures</p>
          </div>
          <Link to="/">
            <Button className="rounded-full gap-2 hidden sm:flex">
              <Plus className="w-4 h-4" />
              Plan a trip
            </Button>
          </Link>
        </div>

        {myTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3">No trips booked... yet!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Time to dust off your bags and start planning your next adventure.
            </p>
            <Link to="/">
              <Button size="lg" className="rounded-full px-8">Start exploring</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {/* Upcoming Trips */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Upcoming &amp; Active</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upcoming.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="group block">
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-muted mb-4 shadow-sm">
                          {trip.cover ? (
                            <img
                              src={trip.cover}
                              alt={trip.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <Plane className="w-12 h-12 text-primary/40" strokeWidth={1} />
                            </div>
                          )}
                          <div className={cn("absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full", STATUS_STYLES[trip.status] ?? STATUS_STYLES.completed)}>
                            {trip.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg leading-tight">{trip.name}</h3>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {trip.destination}
                              </span>
                              {trip.startDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {new Date(trip.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  {trip.endDate && ` – ${new Date(trip.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                                </span>
                              )}
                              {trip.travelers > 1 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {trip.travelers} guests
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors mt-1 shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Past Trips */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Past trips</h2>
                <div className="space-y-3">
                  {past.map((trip, i) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link to="/trips/$tripId" params={{ tripId: trip.id }} className="group flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-foreground/30 transition-colors bg-card">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                          {trip.cover && <img src={trip.cover} alt={trip.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{trip.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{trip.destination}</span>
                            {trip.startDate && (
                              <> · <span>{new Date(trip.startDate).getFullYear()}</span></>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>${trip.budgetSpent?.toFixed(0)}</span>
                          <ChevronRight className="w-4 h-4 group-hover:text-foreground transition-colors" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
