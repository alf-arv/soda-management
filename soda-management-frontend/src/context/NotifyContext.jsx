import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

const NotifyContext = createContext(null);

export function NotifyProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");

  const show = useCallback((msg, sev = "info") => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg) => show(msg, "success"), [show]);
  const showError = useCallback((msg) => show(msg, "error"), [show]);

  const value = useMemo(
    () => ({ show, showSuccess, showError }),
    [show, showSuccess, showError],
  );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={severity}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: 2,
            boxShadow: (t) => t.shadows[8],
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error("useNotify must be used within NotifyProvider");
  }
  return ctx;
}
