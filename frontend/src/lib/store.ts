import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  theme: "light" | "dark";
  onboarded: boolean;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  setOnboarded: (v: boolean) => void;
};

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "light",
      onboarded: false,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    { name: "globetrotter-ui" },
  ),
);
