import { useState } from "react";
import { AppBar, Box, IconButton, Toolbar, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import LocalDrinkRoundedIcon from "@mui/icons-material/LocalDrinkRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import VpnKeyRounded from "@mui/icons-material/VpnKeyRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { useThemeMode } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotifyContext";
import ChangePasswordDialog from "./ChangePasswordDialog";

export default function Header({ user, onLogout, onOpenAdmin, onOpenInfo }) {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const { token, updateToken } = useAuth();
  const { showSuccess, showError } = useNotify();
  const dark = theme.palette.mode === "dark";
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));
  const [pwdOpen, setPwdOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: "calc(12px + env(safe-area-inset-top))",
          mx: "auto",
          left: 0,
          right: 0,
          maxWidth: "min(1100px, calc(100% - 24px))",
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          background: dark
            ? `linear-gradient(135deg, ${alpha("#1a1a1a", 0.92)} 0%, ${alpha("#121212", 0.88)} 100%)`
            : `linear-gradient(135deg, ${alpha("#ffffff", 0.92)} 0%, ${alpha("#f0f4f8", 0.88)} 100%)`,
          backdropFilter: "blur(16px)",
          boxShadow: dark
            ? `0 12px 40px ${alpha("#000000", 0.45)}`
            : `0 4px 24px ${alpha("#000000", 0.08)}`,
        }}
      >
        <Toolbar sx={{ gap: { xs: 0.5, sm: 2 }, py: 1, px: { xs: 1.5, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.25 },
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                flexShrink: 0,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                background: (t) =>
                  `linear-gradient(145deg, ${alpha(t.palette.primary.main, 0.35)}, ${alpha(t.palette.secondary.main, 0.2)})`,
                border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.35)}`,
              }}
            >
              <LocalDrinkRoundedIcon sx={{ color: "primary.main", fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant={isNarrow ? "subtitle1" : "h6"}
                noWrap
                sx={{
                  lineHeight: 1.1,
                  color: "text.primary",
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", sm: "1.25rem" },
                }}
              >
                {isNarrow ? "L18 Soda" : "L18 Soda Service"}
              </Typography>
              {!isNarrow && (
                <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                  Office hydration, reimagined
                </Typography>
              )}
            </Box>
          </Box>

          <IconButton
            aria-label="Change password"
            onClick={() => setPwdOpen(true)}
            size={isNarrow ? "small" : "medium"}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
          >
            <VpnKeyRounded fontSize={isNarrow ? "small" : "medium"} />
          </IconButton>

          {onOpenInfo ? (
            <IconButton
              aria-label="How the soda fund works"
              onClick={onOpenInfo}
              size={isNarrow ? "small" : "medium"}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
              }}
            >
              <HelpOutlineRoundedIcon fontSize={isNarrow ? "small" : "medium"} />
            </IconButton>
          ) : null}

          <IconButton
            aria-label="Toggle theme"
            onClick={toggleMode}
            size={isNarrow ? "small" : "medium"}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
            }}
          >
            {mode === "dark"
              ? <LightModeRoundedIcon fontSize={isNarrow ? "small" : "medium"} />
              : <DarkModeRoundedIcon fontSize={isNarrow ? "small" : "medium"} />}
          </IconButton>

          {user?.role === "ADMIN" ? (
            <IconButton
              aria-label="Admin"
              onClick={onOpenAdmin}
              size={isNarrow ? "small" : "medium"}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main", bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
              }}
            >
              <SettingsSuggestRoundedIcon fontSize={isNarrow ? "small" : "medium"} />
            </IconButton>
          ) : null}

          <IconButton
            aria-label="Logout"
            onClick={onLogout}
            size={isNarrow ? "small" : "medium"}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "error.main", bgcolor: (t) => alpha(t.palette.error.main, 0.08) },
            }}
          >
            <LogoutRoundedIcon fontSize={isNarrow ? "small" : "medium"} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <ChangePasswordDialog
        open={pwdOpen}
        onClose={() => setPwdOpen(false)}
        token={token}
        updateToken={updateToken}
        showSuccess={showSuccess}
        showError={showError}
        username={user?.username}
      />
    </>
  );
}
