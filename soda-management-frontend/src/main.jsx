import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import { getTheme } from "./theme.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotifyProvider } from "./context/NotifyContext.jsx";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeContext.jsx";

function ThemedApp() {
  const { mode } = useThemeMode();
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
