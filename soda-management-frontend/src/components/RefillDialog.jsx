import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import { refillSoda } from "../api/api";

export default function RefillDialog({
  open,
  onClose,
  token,
  username,
  onDone,
  showSuccess,
  showError,
  sodaTypes = [],
}) {
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [sodaType, setSodaType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuantity("");
      setCost("");
      setSodaType("");
      setLoading(false);
      return;
    }
    if (sodaTypes?.length) {
      const first = sodaTypes[0]?.name ?? "";
      setSodaType((prev) =>
        prev && sodaTypes.some((t) => t.name === prev) ? prev : first,
      );
    } else {
      setSodaType("");
    }
  }, [open, sodaTypes]);

  const handleSubmit = async () => {
    const q = Number(quantity);
    const c = Number(cost);
    if (!Number.isFinite(q) || q <= 0) {
      showError("Enter a valid quantity.");
      return;
    }
    if (!Number.isFinite(c) || c < 0) {
      showError("Enter a valid total cost.");
      return;
    }
    if (sodaTypes?.length && !sodaType?.trim()) {
      showError("Select a soda type.");
      return;
    }
    setLoading(true);
    try {
      await refillSoda(username, q, c, token, sodaTypes?.length ? sodaType : undefined);
      showSuccess("Refill logged. You’re a hero.");
      onDone?.();
      onClose();
    } catch (e) {
      showError(e.message || "Could not log refill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Inventory2RoundedIcon color="secondary" />
        Refill stock
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Log what you bought for the team fridge.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {sodaTypes?.length ? (
            <TextField
              select
              required
              label="Soda type"
              value={sodaType}
              onChange={(e) => setSodaType(e.target.value)}
              fullWidth
            >
              {sodaTypes.map((t) => (
                <MenuItem key={t.name} value={t.name}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
          <TextField
            label="Quantity (cans)"
            type="number"
            inputProps={{ min: 1, step: 1 }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
          />
          <TextField
            label="Total cost"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            fullWidth
            helperText="What you paid at the store in SEK"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : null
          }
        >
          Save refill
        </Button>
      </DialogActions>
    </Dialog>
  );
}
