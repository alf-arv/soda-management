import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Skeleton,
  alpha,
  useTheme,
} from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SodaCanIcon from "./SodaCanIcon";
import UserDisplayName from "./UserDisplayName";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function ActivityMessage({ activity, allUsernames }) {
  const { type, sodaType, username, quantity, cost } = activity;
  const qty = quantity ?? 0;
  const sodaLabel = `${sodaType || "soda"}${qty !== 1 ? "s" : ""}`;
  const who = (
    <UserDisplayName username={username} allUsernames={allUsernames} />
  );

  if (type === "TAKE") {
    return (
      <>
        {who} grabbed {qty} {sodaLabel}
      </>
    );
  }
  if (type === "REFILL") {
    return (
      <>
        {who} refilled {qty} {sodaLabel}
        {cost > 0 ? ` (${Number(cost).toFixed(2)} SEK)` : ""}
      </>
    );
  }
  return (
    <>
      {who} — {type || "event"}
    </>
  );
}

export default function ActivityFeed({ activities, loading, sodaTypes, allUsernames }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      <Typography
        variant="h6"
        sx={{
          mb: { xs: 1.5, sm: 2 },
          fontWeight: 700,
          pl: { xs: 0.5, sm: 0 },
        }}
      >
        Recent activity
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : !activities?.length ? (
        <Typography color="text.secondary" variant="body2">
          No events yet. Take a soda or log a refill to get the story started.
        </Typography>
      ) : (
        <List disablePadding sx={{ maxHeight: 420, overflow: "auto" }}>
          {activities.map((a) => {
            const typeColor =
              sodaTypes?.find((t) => t.name === a.sodaType)?.color ||
              theme.palette.secondary.main;
            return (
              <ListItem
                key={a.id || `${a.timestamp}-${a.message}`}
                sx={{
                  alignItems: "flex-start",
                  borderRadius: 2,
                  mb: 0.5,
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, mt: 0.25 }}>
                  {a.type === "TAKE" ? (
                    <SodaCanIcon sx={{ color: typeColor, fontSize: 22 }} />
                  ) : (
                    <BoltRoundedIcon sx={{ color: typeColor, fontSize: 22 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={<ActivityMessage activity={a} allUsernames={allUsernames} />}
                  secondary={formatTime(a.timestamp)}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500, component: "div" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
