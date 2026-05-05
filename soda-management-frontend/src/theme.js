import { createTheme, alpha } from "@mui/material/styles";

const gold = "#d4a853";
const teal = "#4ecdc4";

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
  h1: { fontWeight: 700, letterSpacing: "-0.03em" },
  h2: { fontWeight: 700, letterSpacing: "-0.02em" },
  h3: { fontWeight: 600, letterSpacing: "-0.02em" },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.02em" },
};

const sharedShape = { borderRadius: 16 };

const sharedButtonRoot = {
  borderRadius: 14,
  paddingInline: 20,
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
};

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: gold, contrastText: "#0a0a0a" },
    secondary: { main: teal, contrastText: "#0a0a0a" },
    background: { default: "#0a0a0a", paper: "#1a1a1a" },
    text: {
      primary: "rgba(255,255,255,0.92)",
      secondary: "rgba(255,255,255,0.58)",
    },
    success: { main: "#6ee7a8" },
    error: { main: "#f87171" },
    divider: alpha("#ffffff", 0.08),
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0a0a0a",
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(gold, 0.18)}, transparent),
            radial-gradient(ellipse 60% 40% at 100% 0%, ${alpha(teal, 0.08)}, transparent)
          `,
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
        "html.is-standalone body": {
          paddingTop: "env(safe-area-inset-top)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#121212",
          border: `1px solid ${alpha("#ffffff", 0.06)}`,
          boxShadow: `0 8px 32px ${alpha("#000000", 0.45)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: sharedButtonRoot,
        containedPrimary: {
          boxShadow: `0 4px 24px ${alpha(gold, 0.35)}`,
          "&:hover": { boxShadow: `0 6px 28px ${alpha(gold, 0.45)}` },
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: alpha("#ffffff", 0.03) },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: alpha("#ffffff", 0.08) },
      },
    },
  },
});

const skyStart = "#bcd5f0";
const skyMid = "#dde8f5";
const skyEnd = "#f8fafc";
const accentBlue = "#5b9ef5";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4a90d9", contrastText: "#ffffff" },
    secondary: { main: "#2db5ac", contrastText: "#ffffff" },
    background: { default: skyEnd, paper: "#ffffff" },
    text: {
      primary: "rgba(0,0,0,0.87)",
      secondary: "rgba(0,0,0,0.54)",
    },
    success: { main: "#34a872" },
    error: { main: "#e53e3e" },
    divider: alpha("#000000", 0.08),
  },
  typography: sharedTypography,
  shape: sharedShape,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: skyEnd,
          backgroundImage: `
            radial-gradient(ellipse 90% 60% at 50% -5%, ${alpha(accentBlue, 0.32)}, transparent),
            radial-gradient(ellipse 60% 50% at 100% 0%, ${alpha("#a78bfa", 0.12)}, transparent),
            linear-gradient(180deg, ${skyStart} 0%, ${skyMid} 35%, ${skyEnd} 80%)
          `,
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
        "html.is-standalone body": {
          paddingTop: "env(safe-area-inset-top)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          border: `1px solid ${alpha("#000000", 0.06)}`,
          boxShadow: `0 4px 20px ${alpha("#000000", 0.06)}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: sharedButtonRoot,
        containedPrimary: {
          boxShadow: `0 4px 20px ${alpha("#4a90d9", 0.3)}`,
          "&:hover": { boxShadow: `0 6px 24px ${alpha("#4a90d9", 0.4)}` },
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: alpha("#000000", 0.02) },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: alpha("#000000", 0.06) },
      },
    },
  },
});

export function getTheme(mode) {
  return mode === "dark" ? darkTheme : lightTheme;
}
