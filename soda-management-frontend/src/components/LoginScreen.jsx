import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Fade,
  Paper,
  TextField,
  Typography,
  alpha,
  CircularProgress,
} from "@mui/material";
import LocalDrinkRoundedIcon from "@mui/icons-material/LocalDrinkRounded";
import { useAuth } from "../context/AuthContext";
import { useNotify } from "../context/NotifyContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { showError } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showError("Enter username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      showError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in timeout={600}>
      <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 10 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: (t) =>
                t.palette.mode === "dark"
                  ? "radial-gradient(circle at 20% 0%, rgba(212,168,83,0.15), transparent 45%), radial-gradient(circle at 100% 100%, rgba(78,205,196,0.12), transparent 40%)"
                  : "radial-gradient(circle at 20% 0%, rgba(91,158,245,0.1), transparent 45%), radial-gradient(circle at 100% 100%, rgba(167,139,250,0.08), transparent 40%)",
              pointerEvents: "none",
            },
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 2,
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  background: (t) =>
                    `linear-gradient(145deg, ${alpha(t.palette.primary.main, 0.35)}, ${alpha(t.palette.secondary.main, 0.22)})`,
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.45)}`,
                  boxShadow: (t) => `0 12px 40px ${alpha(t.palette.primary.main, 0.25)}`,
                }}
              >
                <LocalDrinkRoundedIcon sx={{ fontSize: 34, color: "primary.main" }} />
              </Box>
              <Typography variant="h4" gutterBottom>
                Soda As A Service (SaaS)
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Sign in to track the office soda stash at Luntmakargatan 18.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{ mt: 3, py: 1.4 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Continue"
                )}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 4, opacity: 0.7 }}
        >
          Created with thirst by{" "}
          <Typography
            component="a"
            variant="caption"
            href="https://github.com/alf-arv"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            alf-arv
          </Typography>
          {" | "}
          {new Date().getFullYear()}
        </Typography>
      </Container>
    </Fade>
  );
}
