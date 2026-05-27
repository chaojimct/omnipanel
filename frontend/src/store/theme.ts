import { create } from "zustand";

type Theme = "system" | "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) || "system",
  resolved: resolveTheme((localStorage.getItem("theme") as Theme) || "system"),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute("data-theme", resolved);
    set({ theme, resolved });
  },
}));

export function initTheme() {
  const theme = (localStorage.getItem("theme") as Theme) || "system";
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = useThemeStore.getState().theme;
    if (current === "system") {
      const resolved = getSystemTheme();
      document.documentElement.setAttribute("data-theme", resolved);
      useThemeStore.setState({ resolved });
    }
  });
}
