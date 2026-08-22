import { create } from "zustand";
import { persist } from "zustand/middleware";

type LocalePrefsState = {
  language: string;
  country: string;
  setLanguage: (v: string) => void;
  setCountry: (v: string) => void;
};

export const LANGUAGES = ["English (US)", "Français", "Deutsch", "Español", "Português"];
export const COUNTRIES = ["Cameroon", "Nigeria", "France", "United States", "United Kingdom", "South Africa"];

export const useLocalePrefs = create<LocalePrefsState>()(
  persist(
    (set) => ({
      language: "English (US)",
      country: "Cameroon",
      setLanguage: (language) => set({ language }),
      setCountry: (country) => set({ country }),
    }),
    { name: "globetrotter-locale-prefs" },
  ),
);
