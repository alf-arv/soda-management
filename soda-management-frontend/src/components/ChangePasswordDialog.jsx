import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
} from "@mui/material";
import { changePassword, hashPassword } from "../api/api";

export default function ChangePasswordDialog({
  open,
  onClose,
  token,
  updateToken,
  showSuccess,
  showError,
}) {
  const [current, setCurrent] = useState("");
  const [nextPwd, setNextPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetFields = () => {
    setCurrent("");
    setNextPwd("");
    setConfirm("");
  };

  const handleClose = () => {
    if (submitting) return;
    resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    if (nextPwd !== confirm) {
      showError("New password and confirmation do not match.");
      return;
    }
    if (!nextPwd) {
      showError("Enter a new password.");
      return;
    }
    if (!current) {
      showError("Enter your current password.");
      return;
    }
    setSubmitting(true);
    try {
      const hashedCurrent = await hashPassword(current);
      const hashedNew = await hashPassword(nextPwd);
      const data = await changePassword(hashedCurrent, hashedNew, token);
      const newToken = data?.token ?? null;
      if (!newToken) {
        throw new Error("No token received from server");
      }
      updateToken(String(newToken));
      showSuccess("Password changed successfully.");
      resetFields();
      onClose();
    } catch (e) {
      showError(e.message || "Could not change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            fullWidth
            autoComplete="current-password"
            disabled={submitting}
          />
          <TextField
            label="New password"
            type="password"
            value={nextPwd}
            onChange={(e) => setNextPwd(e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={submitting}
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
