import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LocalCafeRoundedIcon from "@mui/icons-material/LocalCafeRounded";
import {
  capitalize,
  contributionRatioScore,
  getNextRefiller,
  splitUsername,
} from "../api/api";
import UserDisplayName from "./UserDisplayName";

const EXPLAINER = [
    "This should be kept a nice and obedient soda community. No alcoholic drinks are allowed and we strictly follow office and company rules.",
    "Soda cooling may not interfere with other usage of the common fridges and cold stock should be kept low.",
    "Anyone with an account can participate — but have to record their actions so trust and fairness remains.",
    "We collaborate in moving cans from the warm storage (soda cabinet) to the fridge, and try to keep a variety of cold sodas available at all times.",
    "When stock runs low, whoever has the lowest net balance is suggested to refill next.",
    "The system is fully community driven and honor-based. One can of Coke is equally valued to a can of Celsius/Loka regardless of purchase prices.",
    "Refill spend is only a fun stat. No money is handled and there are no sales or purchases.",
    "If you want to leave the soda community, settle your outstanding balance and ask an admin to delete your account. Thanks for your participation and welcome back anytime! ⭐",
];

function ChartRow({ row, max, isCurrentUser, allUsernames }) {
  const theme = useTheme();
  const score = row.score;
  const intensity = max > 0 ? Math.min(1, Math.abs(score) / max) : 0;
  const widthPct = max > 0 ? Math.min(100, (Math.abs(score) / max) * 100) : 0;
  const isPositive = score > 0;
  const isNegative = score < 0;

  const positiveStart = alpha(theme.palette.success.main, 0.25);
  const positiveEnd = alpha(theme.palette.success.main, 0.55 + 0.4 * intensity);
  const negativeStart = alpha(theme.palette.error.main, 0.25);
  const negativeEnd = alpha(theme.palette.error.main, 0.55 + 0.4 * intensity);

  const valueColor = isPositive
    ? theme.palette.success.main
    : isNegative
      ? theme.palette.error.main
      : theme.palette.text.secondary;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        py: 0.5,
        px: 0.75,
        borderRadius: 1.5,
        bgcolor: isCurrentUser
          ? alpha(theme.palette.primary.main, 0.08)
          : "transparent",
        border: isCurrentUser
          ? `1px solid ${alpha(theme.palette.primary.main, 0.25)}`
          : "1px solid transparent",
        transition: "background-color 0.2s ease",
      }}
    >
      <Box
        sx={{
          width: { xs: 64, sm: 84 },
          minWidth: { xs: 64, sm: 84 },
          fontSize: "0.78rem",
          fontWeight: isCurrentUser ? 700 : 500,
          color: isCurrentUser ? "text.primary" : "text.secondary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <UserDisplayName username={row.username} allUsernames={allUsernames} />
      </Box>

      <Box
        sx={{
          flex: 1,
          height: 16,
          position: "relative",
          minWidth: 0,
        }}
      >
        {isNegative && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              height: 16,
              right: "50%",
              width: `${widthPct / 2}%`,
              borderRadius: "999px 0 0 999px",
              background: `linear-gradient(270deg, ${negativeStart} 0%, ${negativeEnd} 100%)`,
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
        {isPositive && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              height: 16,
              left: "50%",
              width: `${widthPct / 2}%`,
              borderRadius: "0 999px 999px 0",
              background: `linear-gradient(90deg, ${positiveStart} 0%, ${positiveEnd} 100%)`,
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: "1px",
            transform: "translateX(-0.5px)",
            bgcolor: alpha(theme.palette.text.primary, 0.22),
          }}
        />
      </Box>

      <Box
        sx={{
          width: 56,
          textAlign: "right",
          fontSize: "0.78rem",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: valueColor,
        }}
      >
        {row.label}
      </Box>
    </Box>
  );
}

function DivergingChart({
  title,
  caption,
  rows,
  max,
  currentUsername,
  allUsernames,
  emptyText,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: (t) =>
          t.palette.mode === "dark"
            ? alpha("#ffffff", 0.02)
            : alpha("#000000", 0.015),
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {title}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1.25, display: "block" }}
      >
        {caption}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <Box
          sx={{
            maxHeight: { xs: 260, sm: 320 },
            overflowY: "auto",
            pr: 0.5,
            mx: -0.25,
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (t) => alpha(t.palette.text.primary, 0.18),
              borderRadius: 999,
            },
          }}
        >
          {rows.map((row) => (
            <ChartRow
              key={row.username}
              row={row}
              max={max}
              isCurrentUser={row.username === currentUsername}
              allUsernames={allUsernames}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}

function NextUpCard({ nextUp, currentUsername, allUsernames }) {
  if (!nextUp) return null;
  const isYou = nextUp.username === currentUsername;
  const { first, last } = splitUsername(nextUp.username);
  const initials =
    `${capitalize(first).charAt(0)}${capitalize(last).charAt(0)}`.toUpperCase() ||
    capitalize(nextUp.username).slice(0, 2).toUpperCase();
  const net = nextUp.netBalance ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.25 },
        borderRadius: 2.5,
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, sm: 2 },
        border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.35)}`,
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.1)} 0%, ${alpha(t.palette.warning.main, 0.02)} 100%)`,
      }}
    >
      <Avatar
        sx={{
          bgcolor: (t) => alpha(t.palette.warning.main, 0.2),
          color: "warning.main",
          width: 48,
          height: 48,
          fontWeight: 700,
        }}
      >
        {initials || <LocalCafeRoundedIcon />}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "warning.main",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Up next to refill
        </Typography>
        <Typography
          variant="h6"
          fontWeight={700}
          component="div"
          sx={{ lineHeight: 1.2, mt: 0.25 }}
          noWrap
        >
          <UserDisplayName
            username={nextUp.username}
            allUsernames={allUsernames}
          />
          {isYou ? (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, color: "text.secondary", fontWeight: 500 }}
            >
              (that's you)
            </Typography>
          ) : null}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Net balance{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              color: net < 0 ? "error.main" : net > 0 ? "success.main" : "text.secondary",
            }}
          >
            {net > 0 ? `+${net}` : net}
          </Box>{" "}
          — lowest in the group.
        </Typography>
      </Box>
    </Paper>
  );
}

export default function CommunityInfoDialog({
  open,
  onClose,
  participants = [],
  currentUsername,
}) {
  const allUsernames = participants.map((p) => p.username).filter(Boolean);
  const nextUp = getNextRefiller(participants);

  const netRows = [...participants]
    .map((p) => {
      const net = p.netBalance ?? 0;
      return {
        username: p.username,
        score: net,
        label: net > 0 ? `+${net}` : `${net}`,
      };
    })
    .sort((a, b) => b.score - a.score);

  const ratioRows = [...participants]
    .map((p) => {
      const { score, label } = contributionRatioScore(p);
      return { username: p.username, score, label };
    })
    .sort((a, b) => b.score - a.score);

  const netMax = Math.max(0, ...netRows.map((r) => Math.abs(r.score)));
  const ratioMax = Math.max(0, ...ratioRows.map((r) => Math.abs(r.score)));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          "html.is-ios-standalone &": {
            mt: "calc(env(safe-area-inset-top) + 16px)",
            maxHeight:
              "calc(100% - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 48px)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HelpOutlineRoundedIcon color="primary" />
          Rules & Stats
        </Box>
        <IconButton onClick={onClose} aria-label="Close">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "divider" }}>
        <Box sx={{ mb: 2.5 }}>
          <NextUpCard
            nextUp={nextUp}
            currentUsername={currentUsername}
            allUsernames={allUsernames}
          />
        </Box>

        <Box
          component="ul"
          sx={{
            m: 0,
            mb: 2.5,
            pl: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            color: "text.secondary",
            "& li": { lineHeight: 1.55 },
          }}
        >
          {EXPLAINER.map((line) => (
            <Typography key={line} component="li" variant="body2">
              {line}
            </Typography>
          ))}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <DivergingChart
              title="Net balance"
              caption="Sodas contributed minus sodas taken."
              rows={netRows}
              max={netMax}
              currentUsername={currentUsername}
              allUsernames={allUsernames}
              emptyText="No participants yet."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DivergingChart
              title="Contribution ratio"
              caption="How much each person has put in vs. taken out."
              rows={ratioRows}
              max={ratioMax}
              currentUsername={currentUsername}
              allUsernames={allUsernames}
              emptyText="No participants yet."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
