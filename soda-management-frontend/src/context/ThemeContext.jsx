import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "soda_theme_mode";

const ThemeModeContext = createContext({ mode: "light", toggleMode: () => {} });

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch { /* ignore */ }
  return "light";
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readStored);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
