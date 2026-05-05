import { Box, Button, Paper, Typography, alpha } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { displayName, getNextRefiller, isStockLow } from "../api/api";

export default function LowStockBanner({
  remainingStock,
  participants,
  currentUsername,
  onOpenInfo,
}) {
  if (!isStockLow(remainingStock, participants?.length || 0)) return null;

  const nextUp = getNextRefiller(participants);
  const isYou = nextUp?.username === currentUsername;
  const peopleCount = participants.length;
  const cansLabel = remainingStock === 1 ? "can" : "cans";
  const peopleLabel = peopleCount === 1 ? "person" : "people";

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: { xs: 1.5, sm: 1.75 },
        borderRadius: 2.5,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 1.25, sm: 1.5 },
        border: (t) =>
          `1px solid ${alpha(t.palette.warning.main, t.palette.mode === "light" ? 0.55 : 0.4)}`,
        background: (t) =>
          t.palette.mode === "light"
            ? `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.2)} 0%, ${alpha(t.palette.warning.main, 0.08)} 100%)`
            : `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.12)} 0%, ${alpha(t.palette.warning.main, 0.04)} 100%)`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.25,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: (t) =>
              alpha(t.palette.warning.main, t.palette.mode === "light" ? 0.28 : 0.18),
            color: "warning.main",
            mt: 0.25,
          }}
        >
          <WarningAmberRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            Stock is running low
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.45, mt: 0.25 }}
          >
            Only {remainingStock} {cansLabel} for {peopleCount} {peopleLabel}.
            {nextUp ? (
              isYou ? (
                <>
                  {" "}
                  <Box component="span" sx={{ color: "warning.main", fontWeight: 700 }}>
                    It's your turn to refill.
                  </Box>
                </>
              ) : (
                <>
                  {" "}
                  Up next:{" "}
                  <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                    {displayName(nextUp.username)}
                  </Box>
                  .
                </>
              )
            ) : null}
          </Typography>
        </Box>
      </Box>

      {onOpenInfo ? (
        <Button
          size="small"
          variant="outlined"
          color="warning"
          onClick={onOpenInfo}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            flexShrink: 0,
            ml: { xs: 5.5, sm: 0 },
            borderRadius: 999,
            borderColor: (t) => alpha(t.palette.warning.main, 0.55),
            color: "warning.main",
            "&:hover": {
              borderColor: "warning.main",
              bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
            },
          }}
        >
          See details
        </Button>
      ) : null}
    </Paper>
  );
}
