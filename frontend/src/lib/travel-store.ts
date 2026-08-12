import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Review, Listing } from "./cameroon-data";
import { trips as initialTrips, type Trip } from "./mock-data";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
};

export type PendingBooking = {
  listingId: string;
  checkin: string; // ISO date, e.g. "2026-12-01"
  checkout: string; // ISO date
  guests: number;
};

type TravelState = {
  wishlist: string[];
  userReviews: Review[];
  helpfulVotes: string[];
  
  walletBalance: number;
  transactions: Transaction[];
  myTrips: Trip[];

  pendingBooking: PendingBooking | null;
  
  toggleWish: (id: string) => void;
  addReview: (r: Review) => void;
  toggleHelpful: (id: string) => void;
  setPendingBooking: (b: PendingBooking) => void;
  
  addBooking: (listing: Listing, checkin: string, checkout: string, guests: number, total: number) => string;
};

export const useTravel = create<TravelState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      userReviews: [],
      helpfulVotes: [],
      
      walletBalance: 2450.00, // Initial balance
      transactions: [
        { id: "tx-init", date: new Date().toISOString(), description: "Deposit", amount: 2450, type: "credit" }
      ],
      myTrips: initialTrips,
      pendingBooking: null,

      setPendingBooking: (b) => set({ pendingBooking: b }),
      
      toggleWish: (id) =>
        set({
          wishlist: get().wishlist.includes(id)
            ? get().wishlist.filter((x) => x !== id)
            : [...get().wishlist, id],
        }),
      addReview: (r) => set({ userReviews: [r, ...get().userReviews] }),
      toggleHelpful: (id) =>
        set({
          helpfulVotes: get().helpfulVotes.includes(id)
            ? get().helpfulVotes.filter((x) => x !== id)
            : [...get().helpfulVotes, id],
        }),
        
      addBooking: (listing, checkin, checkout, guests, total) => {
        const tripId = `gt-${Math.random().toString(36).substring(2, 9)}`;
        const txId = `tx-${Math.random().toString(36).substring(2, 9)}`;
        
        const newTrip: Trip = {
          id: tripId,
          name: `${listing.city} Getaway`,
          subtitle: listing.title,
          code: `GT${tripId.substring(3, 6).toUpperCase()} · ${listing.country.substring(0, 3).toUpperCase()}`,
          cover: listing.images[0],
          origin: "Home",
          destination: listing.city,
          startDate: checkin,
          endDate: checkout,
          budgetPlanned: total,
          budgetSpent: total,
          currency: "USD",
          status: "upcoming",
          travelers: guests,
          days: []
        };

        const newTx: Transaction = {
          id: txId,
          date: new Date().toISOString(),
          description: `Booking: ${listing.title}`,
          amount: total,
          type: "debit"
        };

        set((state) => ({
          walletBalance: state.walletBalance - total,
          transactions: [newTx, ...state.transactions],
          myTrips: [newTrip, ...state.myTrips]
        }));
        
        return tripId;
      }
    }),
    { name: "globetrotter-travel" },
  ),
);
