import { Avatar, Box, Paper, Typography, alpha } from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { capitalize, splitUsername } from "../api/api";
import UserDisplayName from "./UserDisplayName";

function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)} SEK`;
}

export default function UserCard({ participant, allUsernames }) {
  const { username, sodasTaken, sodasContributed, moneySpent, netBalance } =
    participant;
  const { first, last } = splitUsername(username);
  const initials =
    `${capitalize(first).charAt(0)}${capitalize(last).charAt(0)}`.toUpperCase() ||
    capitalize(username).slice(0, 2).toUpperCase();
  const owes = netBalance < 0;
  const ahead = netBalance > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 3,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? `0 16px 48px ${alpha("#000000", 0.5)}`
              : `0 12px 32px ${alpha("#000000", 0.1)}`,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: (t) => alpha(t.palette.primary.main, 0.2),
            color: "primary.main",
            width: 44,
            height: 44,
            fontWeight: 700,
          }}
        >
          {initials || <PersonRoundedIcon />}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap component="div">
            <UserDisplayName username={username} allUsernames={allUsernames} />
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Net balance vs. group
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
        }}
      >
        <Stat label="Taken" value={sodasTaken} />
        <Stat label="Contributed" value={sodasContributed} />
        <Stat label="Refill spend" value={formatMoney(moneySpent)} small />
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Net
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: ahead ? "success.main" : owes ? "error.main" : "text.secondary",
              fontWeight: 700,
            }}
          >
            {netBalance > 0 ? `+${netBalance}` : netBalance}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ahead ? "Ahead of the curve" : owes ? "Owes the fridge" : "Even"}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function Stat({ label, value, small }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant={small ? "body1" : "h6"} fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}
