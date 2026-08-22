import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationPrefs = {
  pushTripUpdates: boolean;
  pushMessages: boolean;
  pushPriceDrops: boolean;
  emailBookingReceipts: boolean;
  emailPromotions: boolean;
};

type NotificationPrefsState = NotificationPrefs & {
  setPref: (key: keyof NotificationPrefs, value: boolean) => void;
};

export const useNotificationPrefs = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      pushTripUpdates: true,
      pushMessages: true,
      pushPriceDrops: false,
      emailBookingReceipts: true,
      emailPromotions: false,
      setPref: (key, value) => set({ [key]: value } as Partial<NotificationPrefsState>),
    }),
    { name: "globetrotter-notification-prefs" },
  ),
);
