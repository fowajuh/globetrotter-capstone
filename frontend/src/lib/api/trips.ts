import { api } from "@/lib/api-client";
import type { Trip as UiTrip } from "@/lib/mock-data";

/** Shape returned by the NestJS API (see backend/prisma/schema.prisma: model Trip). */
export type BackendTrip = {
  id: string;
  ownerId: string;
  name: string;
  subtitle: string | null;
  coverPhotoUrl: string | null;
  originCode: string | null;
  destinationCode: string | null;
  startDate: string;
  endDate: string;
  budgetPlanned: string | number;
  status: "draft" | "upcoming" | "active" | "past";
  createdAt: string;
  updatedAt: string;
};

export type CreateTripInput = {
  name: string;
  subtitle?: string | null;
  coverPhotoUrl?: string | null;
  originCode?: string | null;
  destinationCode?: string | null;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  budgetPlanned?: number;
};

/** Backend has no `days`/spend tracking on Trip yet (that lives on Stops) —
 *  fill in placeholders so existing UI components don't need a rewrite. */
export function backendTripToUiTrip(t: BackendTrip): UiTrip {
  return {
    id: t.id,
    name: t.name,
    subtitle: t.subtitle ?? "",
    code: `GT${t.id.slice(0, 6).toUpperCase()} · ${t.destinationCode ?? "???"}`,
    cover: t.coverPhotoUrl ?? "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80",
    origin: t.originCode ?? "—",
    destination: t.destinationCode ?? "—",
    startDate: t.startDate,
    endDate: t.endDate,
    budgetPlanned: Number(t.budgetPlanned),
    budgetSpent: 0, // real value comes from GET /trips/:id/budget-summary
    currency: "USD",
    status: t.status === "active" ? "upcoming" : (t.status as UiTrip["status"]),
    travelers: 1,
    days: [], // real value comes from the trip's stops, fetched separately
  };
}

export type BackendStop = {
  id: string;
  tripId: string;
  dayIndex: number;
  orderIndex: number;
  name: string;
  category: "flight" | "stay" | "eat" | "see" | "move";
  city: string | null;
  country: string | null;
  booked: boolean;
  lat: number | null;
  lng: number | null;
  startTime: string | null;
  endTime: string | null;
  cost: string | number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BackendTripWithStops = BackendTrip & {
  stops: BackendStop[];
};

export type CreateStopInput = {
  dayIndex: number;
  orderIndex: number;
  name: string;
  category?: BackendStop["category"];
  city?: string | null;
  country?: string | null;
  booked?: boolean;
  lat?: number | null;
  lng?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  cost?: number;
  currency?: string;
  notes?: string | null;
};

/** UI-friendly view of one stop, formatted for the itinerary timeline. */
export type UiStop = {
  id: string;
  dayIndex: number;
  time: string;
  duration: string;
  name: string;
  notes: string | null;
  city: string;
  category: BackendStop["category"];
};

/** UI-friendly view of one itinerary day (a trip's date range grouped by
 *  dayIndex), including days that have zero stops so the tab strip always
 *  spans the full length of the trip. */
export type UiDay = {
  index: number;
  date: string;
  stops: UiStop[];
};

function formatStopTime(iso: string | null): string {
  if (!iso) return "Flexible";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Groups a trip's flat stop list into per-day tabs spanning the trip's
 *  full date range (startDate..endDate), even for days with no stops yet,
 *  since the day tabs need to be clickable placeholders too. */
export function buildTripDays(trip: BackendTripWithStops): UiDay[] {
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  const byDay = new Map<number, BackendStop[]>();
  for (const stop of trip.stops) {
    const list = byDay.get(stop.dayIndex) ?? [];
    list.push(stop);
    byDay.set(stop.dayIndex, list);
  }

  return Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const stops = (byDay.get(i) ?? [])
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        id: s.id,
        dayIndex: s.dayIndex,
        time: formatStopTime(s.startTime),
        duration: formatDuration(s.startTime, s.endTime),
        name: s.name,
        notes: s.notes,
        city: s.city ?? trip.destinationCode ?? "",
        category: s.category,
      }));
    return {
      index: i,
      date: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      stops,
    };
  });
}

export const tripsApi = {
  list: (params?: { cursor?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.cursor) qs.set("cursor", params.cursor);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<{ items: BackendTrip[]; nextCursor: string | null }>(`/trips${suffix}`);
  },
  get: (id: string) => api.get<BackendTripWithStops>(`/trips/${id}`),
  create: (input: CreateTripInput) => api.post<BackendTrip>("/trips", input),
  update: (id: string, input: Partial<CreateTripInput> & { status?: BackendTrip["status"] }) =>
    api.patch<BackendTrip>(`/trips/${id}`, input),
  remove: (id: string) => api.delete<void>(`/trips/${id}`),
  duplicate: (id: string) => api.post<BackendTrip>(`/trips/${id}/duplicate`),
  budgetSummary: (id: string) =>
    api.get<{ planned: number; spent: number; remaining: number }>(`/trips/${id}/budget-summary`),
};

export const stopsApi = {
  create: (tripId: string, input: CreateStopInput) => api.post<BackendStop>(`/trips/${tripId}/stops`, input),
  update: (stopId: string, input: Partial<CreateStopInput>) => api.patch<BackendStop>(`/stops/${stopId}`, input),
  remove: (stopId: string) => api.delete<void>(`/stops/${stopId}`),
};
