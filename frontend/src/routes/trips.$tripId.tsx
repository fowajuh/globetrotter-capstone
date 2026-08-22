import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ChevronLeft, Share, Sun, MapPin, Map as MapIcon, Plus, Calendar, Bed, Utensils, Camera, Car, Plane, Wallet, X } from "lucide-react";
import { tripsApi, stopsApi, buildTripDays, type BackendStop, type UiDay } from "@/lib/api/trips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BudgetChart } from "@/components/trips/BudgetChart";

export const Route = createFileRoute("/trips/$tripId")({
  component: TripDetail,
});

const getCategoryIcon = (category: BackendStop["category"]) => {
  switch (category) {
    case "flight": return <Plane className="w-4 h-4" />;
    case "stay": return <Bed className="w-4 h-4" />;
    case "eat": return <Utensils className="w-4 h-4" />;
    case "see": return <Camera className="w-4 h-4" />;
    case "move": return <Car className="w-4 h-4" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

function WeatherWidget({ city }: { city: string }) {
  // No weather provider wired up on the backend yet — kept as an
  // illustrative placeholder rather than pretending it's live data.
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl p-4 text-white shadow-card relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-50">
        <Sun className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90">{city || "Destination"}</p>
        <div className="text-4xl font-bold mt-1">28°</div>
        <p className="text-sm mt-1 opacity-90">Sunny • High 31° (estimate)</p>
      </div>
    </div>
  );
}

function BudgetWidget({ tripId }: { tripId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["trip", tripId, "budget-summary"],
    queryFn: () => tripsApi.budgetSummary(tripId),
  });

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-lg">Budget</h3>
      </div>
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 w-3/4 bg-muted rounded" />
          <div className="h-3 w-1/2 bg-muted rounded" />
        </div>
      ) : (
        <>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Planned</span>
              <span className="font-semibold">${(data?.planned ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spent so far</span>
              <span className="font-semibold">${(data?.spent ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-medium">Remaining</span>
              <span className={cn("font-bold", (data?.remaining ?? 0) < 0 && "text-destructive")}>
                ${(data?.remaining ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
          {data && (
            <BudgetChart byDay={data.byDay} byCategory={data.byCategory} currency={data.currency} />
          )}
        </>
      )}
      <Link to="/budget" className="block mt-4">
        <Button variant="outline" className="w-full">View full budget</Button>
      </Link>
    </div>
  );
}

function AddStopForm({ tripId, dayIndex, onDone }: { tripId: string; dayIndex: number; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BackendStop["category"]>("see");

  const createStop = useMutation({
    mutationFn: () => stopsApi.create(tripId, { dayIndex, orderIndex: 999, name, category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) createStop.mutate();
      }}
      className="p-4 rounded-xl bg-card border border-dashed border-primary/40 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Add a stop</span>
        <button type="button" onClick={onDone} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Limbe Botanic Garden"
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
      />
      <div className="flex gap-2 flex-wrap">
        {(["see", "eat", "stay", "move", "flight"] as const).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border capitalize",
              category === c ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={!name.trim() || createStop.isPending} className="w-full">
        {createStop.isPending ? "Adding…" : "Add stop"}
      </Button>
    </form>
  );
}

function TripDetail() {
  const { tripId } = Route.useParams();
  const [activeDay, setActiveDay] = useState(0);
  const [isAddingStop, setIsAddingStop] = useState(false);

  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripsApi.get(tripId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] min-h-[300px] w-full bg-muted animate-pulse" />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 mt-8 space-y-4">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Trip not found</h1>
          <p className="text-muted-foreground mb-6">
            This trip doesn't exist, or you don't have access to it.
          </p>
          <Link to="/trips" className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full font-semibold">
            <ChevronLeft className="w-4 h-4" /> Back to trips
          </Link>
        </div>
      </div>
    );
  }

  const days: UiDay[] = buildTripDays(trip);
  const cover = trip.coverPhotoUrl ?? "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80";
  const destination = trip.destinationCode ?? "your destination";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="py-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <Link to="/trips" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Back to trips</span>
          </Link>
          <Button variant="outline" className="gap-2">
            <Share className="w-4 h-4" /> Share trip
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-muted">
        <img src={cover} alt={trip.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-screen-xl mx-auto text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            {trip.status === "upcoming" ? "Upcoming Trip" : trip.status}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">{trip.name}</h1>
          <p className="text-lg opacity-90">
            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column: Itinerary Timeline */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Itinerary</h2>
            <Link to="/map" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 px-3 py-2">
              <MapIcon className="w-4 h-4" /> Map view
            </Link>
          </div>

          {/* Days Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {days.map((day, idx) => (
              <button
                key={day.index}
                onClick={() => { setActiveDay(idx); setIsAddingStop(false); }}
                className={cn(
                  "flex flex-col items-center min-w-[80px] px-4 py-3 rounded-xl border transition-micro",
                  activeDay === idx
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-card text-foreground border-border hover:border-primary/50"
                )}
              >
                <span className="text-xs font-semibold uppercase opacity-80 mb-1">Day {day.index + 1}</span>
                <span className="text-sm font-bold">{day.date.split(" ")[1]}</span>
              </button>
            ))}
          </div>

          {/* Timeline UI */}
          <div className="mt-8 space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {days[activeDay]?.stops.length > 0 ? (
              days[activeDay].stops.map((stop, i) => (
                <motion.div
                  key={stop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-card text-muted-foreground shadow-sm group-[.is-active]:bg-primary group-[.is-active]:text-white group-[.is-active]:shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-micro">
                    {getCategoryIcon(stop.category)}
                  </div>

                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary uppercase">{stop.time}</span>
                      {stop.duration && <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md">{stop.duration}</span>}
                    </div>
                    <h3 className="font-bold text-lg">{stop.name}</h3>
                    {stop.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{stop.notes}</p>}
                    {stop.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        <MapPin className="w-3 h-3" /> {stop.city}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : !isAddingStop ? (
              <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">No plans yet</h3>
                <p className="text-muted-foreground mb-6">Add your first stop for this day.</p>
                <Button onClick={() => setIsAddingStop(true)}>Add a stop</Button>
              </div>
            ) : null}

            {isAddingStop ? (
              <AddStopForm tripId={trip.id} dayIndex={activeDay} onDone={() => setIsAddingStop(false)} />
            ) : (
              days[activeDay]?.stops.length > 0 && (
                <button
                  onClick={() => setIsAddingStop(true)}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group w-full text-left"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-muted text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 hover:bg-primary hover:text-white transition-micro shadow-sm">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] text-sm text-muted-foreground">Add another stop</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Right Column: Widgets & Info */}
        <div className="lg:w-80 shrink-0 space-y-6">
          <WeatherWidget city={destination} />
          <BudgetWidget tripId={trip.id} />
        </div>
      </main>
    </div>
  );
}
