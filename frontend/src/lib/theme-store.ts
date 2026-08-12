import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

/** Resolves "system" to an actual light/dark value using the OS preference. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/** Adds/removes the `.dark` class Tailwind's `dark:` variant and our CSS
 *  (see the `.dark { ... }` block in styles.css) key off of. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: "globetrotter-theme",
      onRehydrateStorage: () => (state) => {
        // Storage hydrates after first paint; the inline script in
        // __root.tsx already avoided the flash, this just keeps the
        // zustand-driven state and the DOM class in sync afterwards.
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

/** Inline script string, run before hydration (see RootShell) so the page
 *  never flashes light-then-dark on load for users who picked dark/system-dark. */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("globetrotter-theme");
    var theme = stored ? JSON.parse(stored).state.theme : "system";
    var resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    if (resolved === "dark") document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;
