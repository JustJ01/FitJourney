
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system", // Server renders with this, client first render also uses this
  storageKey = "fitjourney-theme",
}: ThemeProviderProps) {
  // Initialize theme state with defaultTheme for server and initial client render
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // This effect runs only on the client, after hydration.
    // It reads the stored theme preference and updates the state.
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
    // If no theme is stored, it remains defaultTheme (e.g., "system")
    // The next effect will handle applying "system" preference correctly.
  }, [storageKey]); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // This effect also runs only on the client and whenever 'theme' state changes.
    const root = window.document.documentElement;
    
    // Determine the effective theme (light/dark) based on the current 'theme' state
    let effectiveTheme = theme;
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    // Apply the effective theme class to the HTML element
    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);

    // Save the user's *selected* theme (could be "system") to localStorage
    localStorage.setItem(storageKey, theme);

    // If the selected theme is "system", listen for OS-level theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") { // Only re-apply if current selection is "system"
        const newEffectiveTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newEffectiveTheme);
      }
    };

    if (theme === "system") {
      mediaQuery.addEventListener('change', handleChange);
    }

    // Cleanup listener on component unmount or if theme changes from "system"
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, storageKey]); // Runs when theme state changes

  const value = {
    theme, // This is the theme selected by the user ("light", "dark", or "system")
    setTheme: (newTheme: Theme) => {
      setThemeState(newTheme); // This will trigger the effect above
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
