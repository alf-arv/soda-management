import { Box, Typography, alpha, useTheme } from "@mui/material";

export function inferCapacity(remaining, participants = []) {
  const sumTaken = participants.reduce((acc, p) => acc + (p.sodasTaken || 0), 0);
  const sumAdded = participants.reduce(
    (acc, p) => acc + (p.sodasContributed || 0),
    0,
  );
  return Math.max(remaining + sumTaken, sumAdded, 24, 1);
}

function Ring({ size, stock, maxStock, color, label, theme }) {
  const r = (size - 12) / 2;
  const viewBox = size;
  const cx = viewBox / 2;
  const cy = viewBox / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = maxStock > 0 ? Math.min(1, Math.max(0, stock / maxStock)) : 0;
  const dash = ratio * circumference;
  const trackColor =
    theme.palette.mode === "dark"
      ? alpha(theme.palette.common.white, 0.07)
      : alpha(theme.palette.common.black, 0.07);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth="12"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: "text.primary" }}
          >
            {stock}
          </Typography>
        </Box>
      </Box>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, textAlign: "center", maxWidth: size, lineHeight: 1.2 }}
        noWrap
      >
        {label}
      </Typography>
    </Box>
  );
}

const RING_FULL_AT = 20;

export default function SodaGauge({
  remainingStock,
  participants,
  sodaTypes = [],
  stockBySodaType = {},
}) {
  const theme = useTheme();

  const maxStock = RING_FULL_AT;

  const ringSize = sodaTypes.length <= 3 ? 150 : sodaTypes.length <= 5 ? 130 : 110;

  if (!sodaTypes.length) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: { xs: 3, sm: 5 } }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", maxWidth: 360, lineHeight: 1.6, fontStyle: "italic" }}
        >
          No soda variants have been configured, ask an admin to configure them through the admin management menu
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, py: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: { xs: 2, sm: 3 },
        }}
      >
        {sodaTypes.map((type) => {
          const stock = Number(stockBySodaType[type.name]) || 0;
          return (
            <Ring
              key={type.name}
              size={ringSize}
              stock={stock}
              maxStock={maxStock}
              color={type.color}
              label={type.name}
              theme={theme}
            />
          );
        })}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.secondary" }}>
          {remainingStock}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          total sodas in stash
        </Typography>
      </Box>
    </Box>
  );
}
