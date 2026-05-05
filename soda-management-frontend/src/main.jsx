import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import { getTheme } from "./theme.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotifyProvider } from "./context/NotifyContext.jsx";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeContext.jsx";

const TOP_COLOR = { light: "#a8c8ec", dark: "#0a0a0a" };

if (typeof window !== "undefined") {
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches;
  if (isStandalone) {
    document.documentElement.classList.add("is-standalone");
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
    if (isIOS) {
      document.documentElement.classList.add("is-ios-standalone");
    }
    const applyBodyPadding = () => {
      if (document.body) {
        document.body.style.paddingTop = "env(safe-area-inset-top)";
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyBodyPadding);
    } else {
      applyBodyPadding();
    }
  }
}

function ThemedApp() {
  const { mode } = useThemeMode();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const color = TOP_COLOR[mode] || TOP_COLOR.light;
    const meta = document.querySelector("meta[name='theme-color'][data-dynamic-theme-color]");
    if (meta) meta.setAttribute("content", color);
    if (document.body) document.body.style.backgroundColor = color;
    if (document.documentElement) document.documentElement.style.backgroundColor = color;
  }, [mode]);

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <NotifyProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotifyProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeModeProvider>
        <ThemedApp />
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
