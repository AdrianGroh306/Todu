"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { THEME_STORAGE_KEY, THEMES, type ThemeId } from "@/features/shared/constants/theme";

export { THEMES, type ThemeConfig, type ThemeId } from "@/features/shared/constants/theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// THEME_INIT_SCRIPT already set data-theme before hydration
const readInitialTheme = (): ThemeId => {
  if (typeof document === "undefined") return "dark";
  const current = document.documentElement.getAttribute("data-theme") as ThemeId | null;
  return current && THEMES.some((t) => t.id === current) ? current : "dark";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeId>(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${theme}`);
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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
