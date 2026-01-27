"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type ThemeId =
  | "dark"
  | "light"
  | "ocean"
  | "forest"
  | "sunset"
  | "lavender"
  | "rose";

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  preview: string;
};

export const THEMES: ThemeConfig[] = [
  { id: "dark", name: "Dark", preview: "bg-slate-900" },
  { id: "light", name: "Light", preview: "bg-slate-100" },
  { id: "ocean", name: "Ocean", preview: "bg-sky-600" },
  { id: "forest", name: "Forest", preview: "bg-emerald-600" },
  { id: "sunset", name: "Sunset", preview: "bg-orange-500" },
  { id: "lavender", name: "Lavender", preview: "bg-purple-500" },
  { id: "rose", name: "Rose", preview: "bg-rose-500" },
];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "todu-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.some((t) => t.id === stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Remove all theme classes
    THEMES.forEach((t) => {
      document.documentElement.classList.remove(`theme-${t.id}`);
    });

    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute("data-theme", theme);

    // Persist
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
  };

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
