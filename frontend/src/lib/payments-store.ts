import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CardBrand = "visa" | "mastercard" | "amex" | "other";

export type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
};

type PaymentsState = {
  cards: SavedCard[];
  defaultCardId: string | null;
  addCard: (card: Omit<SavedCard, "id">) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
};

/** No real payment processor sits behind this (see checkout.$stayId.tsx —
 *  card entry there doesn't persist either), so "saved cards" are a local
 *  convenience list, same trust level as the wallet balance in
 *  travel-store.ts. Detecting a brand from a number is enough for the UI;
 *  nothing here is sent anywhere. */
export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "other";
}

export const usePayments = create<PaymentsState>()(
  persist(
    (set, get) => ({
      cards: [
        { id: "card-seed-1", brand: "visa", last4: "4242", expMonth: 12, expYear: 28, holderName: "You" },
        { id: "card-seed-2", brand: "mastercard", last4: "5555", expMonth: 9, expYear: 26, holderName: "You" },
      ],
      defaultCardId: "card-seed-1",

      addCard: (card) => {
        const id = `card-${Math.random().toString(36).slice(2, 9)}`;
        set((state) => ({
          cards: [...state.cards, { ...card, id }],
          defaultCardId: state.defaultCardId ?? id,
        }));
      },
      removeCard: (id) => {
        set((state) => {
          const cards = state.cards.filter((c) => c.id !== id);
          const defaultCardId = state.defaultCardId === id ? (cards[0]?.id ?? null) : state.defaultCardId;
          return { cards, defaultCardId };
        });
      },
      setDefaultCard: (id) => {
        if (!get().cards.some((c) => c.id === id)) return;
        set({ defaultCardId: id });
      },
    }),
    { name: "globetrotter-payments" },
  ),
);
