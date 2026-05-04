import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  CircularProgress,
  keyframes,
  alpha,
  ButtonBase,
  useTheme,
} from "@mui/material";
import LocalDrinkRoundedIcon from "@mui/icons-material/LocalDrinkRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { takeSoda } from "../api/api";
import { inferCapacity } from "./SodaGauge";

const pop = keyframes`
  0% { transform: scale(0.85); opacity: 0.6; }
  55% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

// Pick a readable foreground color for a given hex background (used on the small color chip).
function getContrastText(hex) {
  if (!hex || typeof hex !== "string") return "#ffffff";
  const c = hex.replace("#", "").trim();
  if (c.length !== 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return "#ffffff";
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "rgba(0,0,0,0.87)" : "#ffffff";
}

function SodaButton({ sodaType, stock, capacity, onClick, busy, anyBusy }) {
  const theme = useTheme();
  const color = sodaType.color || theme.palette.text.disabled;
  const chipFg = getContrastText(color);
  const isOutOfStock = stock <= 0;
  const disabled = isOutOfStock || anyBusy;
  const fillPct = capacity > 0 ? Math.max(0, Math.min(1, stock / capacity)) : 0;

  const isDark = theme.palette.mode === "dark";
  const baseBg = isDark
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.035);
  const hoverBg = isDark
    ? alpha(theme.palette.common.white, 0.07)
    : alpha(theme.palette.common.black, 0.06);
  const borderColor = theme.palette.divider;
  const trackBg = isDark
    ? alpha(theme.palette.common.white, 0.07)
    : alpha(theme.palette.common.black, 0.07);

  // Soft horizontal fade — transparent on the left, gently absorbing the soda color toward the right.
  const fade = `linear-gradient(90deg,
    transparent 0%,
    transparent 55%,
    ${alpha(color, 0.08)} 75%,
    ${alpha(color, 0.18)} 100%)`;

  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      focusRipple
      sx={{
        width: "100%",
        textAlign: "left",
        borderRadius: 999,
        p: 0,
        overflow: "hidden",
        position: "relative",
        bgcolor: baseBg,
        border: `1px solid ${borderColor}`,
        transition:
          "transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease",
        opacity: disabled && !busy ? 0.55 : 1,
        "&:hover": {
          bgcolor: disabled ? baseBg : hoverBg,
          borderColor: disabled ? borderColor : alpha(color, 0.5),
          transform: disabled ? "none" : "translateY(-1px)",
        },
        "&:active": {
          transform: disabled ? "none" : "translateY(0)",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          minHeight: 64,
          pl: 2.5,
          pr: 1.25,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          position: "relative",
          color: "text.primary",
        }}
      >
        {/* Color fade overlay — sits behind text, in front of base bg */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: fade,
            pointerEvents: "none",
          }}
        />

        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            minWidth: 0,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              letterSpacing: "-0.005em",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sodaType.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontWeight: 500 }}
          >
            {isOutOfStock ? "Out of stock" : `${stock} left`}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            width: 44,
            height: 44,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: color,
            color: chipFg,
            boxShadow: disabled
              ? "none"
              : `0 4px 14px ${alpha(color, 0.4)}`,
            transition: "box-shadow 0.18s ease",
          }}
        >
          {busy ? (
            <CircularProgress size={20} sx={{ color: chipFg }} />
          ) : (
            <LocalDrinkRoundedIcon sx={{ fontSize: 22 }} />
          )}
        </Box>

        {/* Progress track at the bottom — same denominator as the dashboard rings */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            bgcolor: trackBg,
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${fillPct * 100}%`,
              bgcolor: color,
              opacity: 0.85,
              transition: "width 0.4s ease",
            }}
          />
        </Box>
      </Box>
    </ButtonBase>
  );
}

export default function TakeSodaDialog({
  open,
  onClose,
  token,
  username,
  remainingStock,
  onDone,
  showSuccess,
  showError,
  sodaTypes = [],
  stockBySodaType = {},
  participants = [],
}) {
  const [pendingType, setPendingType] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!open) {
      setCelebrate(false);
      setPendingType(null);
    }
  }, [open]);

  // Match SodaGauge's denominator so this dialog's progress bars track the dashboard rings.
  const capacity = useMemo(() => {
    const inferred = inferCapacity(remainingStock, participants);
    if (!sodaTypes?.length) return inferred;
    const maxTypeStock = sodaTypes.reduce((m, t) => {
      const s = Number(stockBySodaType[t.name]) || 0;
      return s > m ? s : m;
    }, 0);
    return Math.max(1, inferred, maxTypeStock);
  }, [remainingStock, participants, sodaTypes, stockBySodaType]);

  const handlePick = async (typeName) => {
    if (!username || pendingType) return;
    setPendingType(typeName);
    try {
      await takeSoda(username, token, typeName);
      setCelebrate(true);
      showSuccess("Enjoy — logged.");
      onDone?.();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e) {
      showError(e.message || "Could not take a soda");
      setPendingType(null);
    }
  };

  // Fallback path: no soda types configured — keep a simple confirm flow.
  const handleLegacyConfirm = async () => {
    if (!username || pendingType) return;
    setPendingType("__legacy__");
    try {
      await takeSoda(username, token);
      setCelebrate(true);
      showSuccess("Enjoy — logged.");
      onDone?.();
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e) {
      showError(e.message || "Could not take a soda");
      setPendingType(null);
    }
  };

  const busy = pendingType !== null;
  const hasTypes = (sodaTypes?.length ?? 0) > 0;
  const noStockOverall = remainingStock <= 0;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <LocalDrinkRoundedIcon color="primary" />
        Grab a cold one?
      </DialogTitle>
      <DialogContent>
        {celebrate ? (
          <Box
            sx={{
              py: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              animation: `${pop} 0.55s ease`,
            }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "success.main" }} />
            <Typography variant="h6" fontWeight={700}>
              Cheers!
            </Typography>
            <Typography color="text.secondary" align="center" variant="body2">
              Stock updated.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              {hasTypes
                ? "Tap a soda to log it. One tap, you're done."
                : "One tap logs a can from the communal stash."}
            </Typography>
            {hasTypes ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {sodaTypes.map((t) => {
                  const stock = Number(stockBySodaType[t.name]) || 0;
                  return (
                    <SodaButton
                      key={t.name}
                      sodaType={t}
                      stock={stock}
                      capacity={capacity}
                      onClick={() => handlePick(t.name)}
                      busy={pendingType === t.name}
                      anyBusy={busy}
                    />
                  );
                })}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  border: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Current stock
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {remainingStock}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      {!celebrate && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={busy}>
            {hasTypes ? "Close" : "Cancel"}
          </Button>
          {!hasTypes && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleLegacyConfirm}
              disabled={busy || noStockOverall}
              startIcon={
                busy ? <CircularProgress size={18} color="inherit" /> : null
              }
            >
              {noStockOverall ? "Out of stock" : "Confirm"}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
