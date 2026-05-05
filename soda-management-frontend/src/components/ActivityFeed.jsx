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

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function ActivityFeed({ activities, loading, sodaTypes }) {
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
                  primary={a.message || "Event"}
                  secondary={formatTime(a.timestamp)}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
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
