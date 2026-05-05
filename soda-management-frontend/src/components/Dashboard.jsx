import { useCallback, useEffect, useState } from "react";
import { Fade, Box, Button, Container, Grid, Paper, Skeleton, Typography, alpha, keyframes } from "@mui/material";
import SodaCanIcon from "./SodaCanIcon";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import { getStatus, normalizeStatus } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotifyContext";
import Header from "./Header";
import SodaGauge from "./SodaGauge";
import UserCard from "./UserCard";
import ActivityFeed from "./ActivityFeed";
import TakeSodaDialog from "./TakeSodaDialog";
import RefillDialog from "./RefillDialog";
import AdminPanel from "./AdminPanel";
import LowStockBanner from "./LowStockBanner";
import CommunityInfoDialog from "./CommunityInfoDialog";

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(212,168,83,0.45); }
  70% { box-shadow: 0 0 0 16px rgba(212,168,83,0); }
  100% { box-shadow: 0 0 0 0 rgba(212,168,83,0); }
`;

const POLL_MS = 30_000;

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const { showSuccess, showError } = useNotify();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [takeOpen, setTakeOpen] = useState(false);
  const [refillOpen, setRefillOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await getStatus(token);
      setStatus(normalizeStatus(raw));
    } catch (e) {
      showError(e.message || "Could not refresh status");
    } finally {
      setLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      setLoading(true);
      try {
        const raw = await getStatus(token);
        if (!cancelled) setStatus(normalizeStatus(raw));
      } catch (e) {
        if (!cancelled) showError(e.message || "Could not load status");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, showError]);

  useEffect(() => {
    if (!token) return undefined;
    const id = setInterval(() => {
      load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [token, load]);

  const remaining = status?.remainingStock ?? 0;
  const participants = status?.participants ?? [];
  const activities = status?.activities ?? [];
  const sodaTypes = status?.sodaTypes ?? [];
  const stockBySodaType = status?.stockBySodaType ?? {};
  const allUsernames = participants.map((p) => p.username).filter(Boolean);

  return (
    <Fade in timeout={500}>
      <Box sx={{ pb: { xs: 14, sm: 10 } }}>
        <Header
          user={user}
          onLogout={logout}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenInfo={() => setInfoOpen(true)}
        />

        <Container maxWidth="lg" sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: 3,
              alignItems: "flex-start",
            }}
          >
            <Box sx={{ flex: "1 1 0%", minWidth: 0, width: { xs: "100%", lg: "auto" } }}>
              <LowStockBanner
                remainingStock={remaining}
                participants={participants}
                currentUsername={user?.username}
                onOpenInfo={() => setInfoOpen(true)}
              />
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 4 },
                  mb: 3,
                  borderRadius: 4,
                  position: "relative",
                  overflow: "hidden",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: (t) =>
                      t.palette.mode === "dark"
                        ? "radial-gradient(circle at 0% 0%, rgba(212,168,83,0.12), transparent 42%), radial-gradient(circle at 100% 0%, rgba(78,205,196,0.1), transparent 38%)"
                        : "radial-gradient(circle at 0% 0%, rgba(91,158,245,0.08), transparent 42%), radial-gradient(circle at 100% 0%, rgba(167,139,250,0.06), transparent 38%)",
                  },
                }}
              >
                <Box sx={{ position: "relative", zIndex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: { xs: 1.5, sm: 2 },
                      fontWeight: 700,
                      pl: { xs: 0.5, sm: 0 },
                    }}
                  >
                    Current inventory
                  </Typography>
                  {loading && !status ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
                      <Skeleton variant="circular" width={220} height={220} />
                      <Skeleton width={160} sx={{ mt: 2 }} />
                    </Box>
                  ) : (
                    <SodaGauge
                      remainingStock={remaining}
                      participants={participants}
                      sodaTypes={sodaTypes}
                      stockBySodaType={stockBySodaType}
                    />
                  )}
                </Box>
              </Paper>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Soda enjoyers
              </Typography>
              <Grid container spacing={2} sx={{ mb: { xs: 3, lg: 0 } }}>
                {loading && !participants.length
                  ? [1, 2, 3].map((i) => (
                      <Grid item xs={12} sm={6} md={4} key={i}>
                        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 3 }} />
                      </Grid>
                    ))
                  : participants.map((p, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={p.username || `participant-${idx}`}>
                        <UserCard participant={p} allUsernames={allUsernames} />
                      </Grid>
                    ))}
              </Grid>
            </Box>

            <Box
              sx={{
                width: { xs: "100%", lg: "30%" },
                flexShrink: 0,
                position: { lg: "sticky" },
                top: { lg: 88 },
              }}
            >
              <ActivityFeed
                activities={activities}
                loading={loading && !activities.length}
                sodaTypes={sodaTypes}
                allUsernames={allUsernames}
              />
            </Box>
          </Box>
        </Container>

        <Box
          sx={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: { xs: 16, sm: 24 },
            width: "min(640px, calc(100% - 32px))",
            zIndex: (t) => t.zIndex.drawer + 1,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 1.25,
              display: "flex",
              gap: 1.25,
              borderRadius: 999,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) =>
                t.palette.mode === "dark"
                  ? `linear-gradient(135deg, ${alpha("#1a1a1a", 0.95)} 0%, ${alpha("#121212", 0.92)} 100%)`
                  : `linear-gradient(135deg, ${alpha("#ffffff", 0.95)} 0%, ${alpha("#f0f4f8", 0.92)} 100%)`,
              backdropFilter: "blur(18px)",
              boxShadow: (t) =>
                t.palette.mode === "dark"
                  ? `0 20px 60px ${alpha("#000000", 0.55)}`
                  : `0 8px 32px ${alpha("#000000", 0.1)}`,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<SodaCanIcon />}
              onClick={() => setTakeOpen(true)}
              sx={{
                py: 1.5,
                borderRadius: 999,
                fontSize: "1rem",
                animation: `${pulse} 3.2s ease-out infinite`,
                "&:hover": {
                  transform: "translateY(-1px) scale(1.01)",
                },
                transition: "transform 0.2s ease",
              }}
            >
              Take a Soda
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              fullWidth
              startIcon={<Inventory2RoundedIcon />}
              onClick={() => setRefillOpen(true)}
              sx={{
                py: 1.5,
                borderRadius: 999,
                borderColor: (t) => alpha(t.palette.secondary.main, 0.55),
                color: "secondary.main",
                "&:hover": {
                  borderColor: "secondary.main",
                  bgcolor: (t) => alpha(t.palette.secondary.main, 0.08),
                },
              }}
            >
              Refill Stock
            </Button>
          </Paper>
        </Box>

        <TakeSodaDialog
          open={takeOpen}
          onClose={() => setTakeOpen(false)}
          token={token}
          username={user?.username}
          remainingStock={remaining}
          onDone={load}
          showSuccess={showSuccess}
          showError={showError}
          sodaTypes={sodaTypes}
          stockBySodaType={stockBySodaType}
          participants={participants}
        />
        <RefillDialog
          open={refillOpen}
          onClose={() => setRefillOpen(false)}
          token={token}
          username={user?.username}
          onDone={load}
          showSuccess={showSuccess}
          showError={showError}
          sodaTypes={sodaTypes}
        />
        <AdminPanel
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          token={token}
          showSuccess={showSuccess}
          showError={showError}
          stockBySodaType={stockBySodaType}
          onDataChanged={load}
        />
        <CommunityInfoDialog
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          participants={participants}
          currentUsername={user?.username}
        />
      </Box>
    </Fade>
  );
}
