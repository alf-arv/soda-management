import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  alpha,
  CircularProgress,
  Paper,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  addUser,
  addSodaType,
  getSodaTypes,
  getUsers,
  hashPassword,
  normalizeUsersList,
  removeSodaType,
  removeUser,
  setSodaStock,
  updateUserStats,
  verifyAdmin,
  displayName,
} from "../api/api";

export default function AdminPanel({
  open,
  onClose,
  token,
  showSuccess,
  showError,
  stockBySodaType = {},
  onDataChanged,
}) {
  const [step, setStep] = useState("lock");
  const [adminPassword, setAdminPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);

  const [sodaTypes, setSodaTypes] = useState([]);
  const [loadingSodaTypes, setLoadingSodaTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#4ecdc4");
  const [addingType, setAddingType] = useState(false);
  const [removingType, setRemovingType] = useState(null);

  const [editUsername, setEditUsername] = useState(null);
  const [editTaken, setEditTaken] = useState("");
  const [editRefilled, setEditRefilled] = useState("");
  const [editRefillSpend, setEditRefillSpend] = useState("");
  const [savingStats, setSavingStats] = useState(false);

  const [stockEditOpen, setStockEditOpen] = useState(false);
  const [stockDraft, setStockDraft] = useState({});
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("lock");
      setAdminPassword("");
      setUsers([]);
      setNewName("");
      setMakeAdmin(false);
      setGeneratedPassword(null);
      setConfirmDeleteType(null);
      setVerifying(false);
      setLoadingUsers(false);
      setCreating(false);
      setRemoving(null);
      setSodaTypes([]);
      setLoadingSodaTypes(false);
      setNewTypeName("");
      setNewTypeColor("#4ecdc4");
      setAddingType(false);
      setRemovingType(null);
      setEditUsername(null);
      setEditTaken("");
      setEditRefilled("");
      setEditRefillSpend("");
      setSavingStats(false);
      setStockEditOpen(false);
      setStockDraft({});
      setSavingStock(false);
    }
  }, [open]);

  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getUsers(token);
      const list = normalizeUsersList(data);
      setUsers(list);
    } catch (e) {
      showError(e.message || "Could not load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshSodaTypes = async () => {
    setLoadingSodaTypes(true);
    try {
      const data = await getSodaTypes(token);
      setSodaTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      showError(e.message || "Could not load soda types");
    } finally {
      setLoadingSodaTypes(false);
    }
  };

  const handleVerify = async () => {
    if (!adminPassword) {
      showError("Enter admin password.");
      return;
    }
    setVerifying(true);
    try {
      const hashed = await hashPassword(adminPassword);
      await verifyAdmin(hashed, token);
      setAdminPassword(hashed);
      setStep("admin");
      await Promise.all([refreshUsers(), refreshSodaTypes()]);
      showSuccess("Admin access granted.");
    } catch (e) {
      showError(e.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      showError("Enter a name for the new user.");
      return;
    }
    setCreating(true);
    setGeneratedPassword(null);
    try {
      await addUser(name, makeAdmin, token, adminPassword);
      setGeneratedPassword(name.toLowerCase());
      setNewName("");
      setMakeAdmin(false);
      await refreshUsers();
      showSuccess("User created.");
    } catch (e) {
      showError(e.message || "Could not create user");
    } finally {
      setCreating(false);
    }
  };

  const handleRemove = async (username) => {
    const u = String(username);
    if (!u) return;
    setRemoving(u);
    try {
      await removeUser(u, token, adminPassword);
      showSuccess(`Removed ${u}`);
      await refreshUsers();
    } catch (e) {
      showError(e.message || "Could not remove user");
    } finally {
      setRemoving(null);
    }
  };

  const openEditStats = (entry) => {
    setEditUsername(entry.username);
    setEditTaken(String(entry.sodasTaken ?? 0));
    setEditRefilled(String(entry.sodasRefilled ?? 0));
    setEditRefillSpend(String(entry.totalMoneySpentOnRefills ?? 0));
  };

  const handleSaveStats = async () => {
    if (!editUsername) return;
    const taken = Number(editTaken);
    const refilled = Number(editRefilled);
    const refillSpend = Number(editRefillSpend);
    if (
      !Number.isFinite(taken) || taken < 0 ||
      !Number.isFinite(refilled) || refilled < 0 ||
      !Number.isFinite(refillSpend) || refillSpend < 0
    ) {
      showError("Enter valid non-negative numbers.");
      return;
    }
    setSavingStats(true);
    try {
      await updateUserStats(editUsername, taken, refilled, refillSpend, token, adminPassword);
      showSuccess("Stats updated.");
      setEditUsername(null);
      await refreshUsers();
    } catch (e) {
      showError(e.message || "Could not update stats");
    } finally {
      setSavingStats(false);
    }
  };

  const handleAddSodaType = async () => {
    const name = newTypeName.trim();
    if (!name) {
      showError("Enter a soda type name.");
      return;
    }
    setAddingType(true);
    try {
      await addSodaType(name, newTypeColor, token, adminPassword);
      setNewTypeName("");
      await refreshSodaTypes();
      showSuccess("Soda type added.");
    } catch (e) {
      showError(e.message || "Could not add soda type");
    } finally {
      setAddingType(false);
    }
  };

  const handleRemoveSodaType = async () => {
    const n = confirmDeleteType;
    if (!n) return;
    setConfirmDeleteType(null);
    setRemovingType(n);
    try {
      await removeSodaType(n, token, adminPassword);
      await refreshSodaTypes();
      onDataChanged?.();
      showSuccess(`Removed ${n}`);
    } catch (e) {
      showError(e.message || "Could not remove soda type");
    } finally {
      setRemovingType(null);
    }
  };

  const openEditStock = () => {
    const draft = {};
    sodaTypes.forEach((st) => {
      const current = Number(stockBySodaType?.[st.name]);
      draft[st.name] = String(Number.isFinite(current) ? current : 0);
    });
    setStockDraft(draft);
    setStockEditOpen(true);
  };

  const handleSaveStock = async () => {
    const payload = {};
    for (const st of sodaTypes) {
      const raw = stockDraft[st.name];
      const n = Number(raw);
      if (raw === "" || raw === undefined || raw === null || !Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        showError(`Enter a valid non-negative whole number for ${st.name}.`);
        return;
      }
      payload[st.name] = n;
    }
    setSavingStock(true);
    try {
      await setSodaStock(payload, token, adminPassword);
      showSuccess("Stock counts updated.");
      setStockEditOpen(false);
      onDataChanged?.();
    } catch (e) {
      showError(e.message || "Could not update stock");
    } finally {
      setSavingStock(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={verifying || creating || savingStats || addingType || savingStock ? undefined : onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldRoundedIcon color="primary" />
            Admin
          </Box>
          <IconButton onClick={onClose} aria-label="Close" disabled={verifying}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: "divider" }}>
          {step === "lock" ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <Typography color="text.secondary" variant="body2">
                Enter the admin password to manage accounts.
              </Typography>
              <TextField
                label="Admin password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerify();
                }}
                fullWidth
                autoFocus
              />
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={verifying}
                startIcon={
                  verifying ? <CircularProgress size={18} color="inherit" /> : null
                }
              >
                Unlock
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Users
              </Typography>
              {loadingUsers ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <List dense disablePadding>
                  {users.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      No users returned.
                    </Typography>
                  ) : (
                    users.map((u) => (
                        <ListItem
                          key={u.username}
                          secondaryAction={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <IconButton
                                edge="end"
                                aria-label={`Edit stats for ${u.username}`}
                                onClick={() => openEditStats(u)}
                                disabled={removing === u.username || savingStats}
                              >
                                <EditRounded fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                aria-label={`Remove ${u.username}`}
                                onClick={() => handleRemove(u.username)}
                                disabled={removing === u.username}
                              >
                                {removing === u.username ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteOutlineRoundedIcon />
                                )}
                              </IconButton>
                            </Box>
                          }
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            pr: 10,
                            bgcolor: "action.hover",
                          }}
                        >
                          <ListItemText
                            primary={displayName(u.username)}
                            secondary={`Taken: ${u.sodasTaken ?? 0} · Contributed: ${u.sodasRefilled ?? 0} · Spent: ${Number(u.totalMoneySpentOnRefills ?? 0).toFixed(2)} SEK`}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                        </ListItem>
                    ))
                  )}
                </List>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Add user
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <TextField
                  label="Display name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  sx={{ flex: "1 1 200px" }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={makeAdmin}
                      onChange={(e) => setMakeAdmin(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Make admin"
                  sx={{ mr: 0 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAdd}
                  disabled={creating}
                  sx={{ height: 56, px: 3 }}
                >
                  {creating ? <CircularProgress size={22} color="inherit" /> : "Add"}
                </Button>
              </Box>

              {generatedPassword ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: (t) => `1px dashed ${alpha(t.palette.primary.main, 0.45)}`,
                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    User created. The initial password is the same as the username
                    (<Typography component="span" variant="body2" sx={{ fontWeight: 700, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{generatedPassword}</Typography>).
                    The user should change it after first login.
                  </Typography>
                </Paper>
              ) : null}

              <Divider sx={{ my: 1 }} />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Soda types
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<TuneRoundedIcon fontSize="small" />}
                  onClick={openEditStock}
                  disabled={loadingSodaTypes || sodaTypes.length === 0}
                >
                  Set stock counts
                </Button>
              </Box>
              {loadingSodaTypes ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : sodaTypes.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No soda types yet.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {sodaTypes.map((st) => (
                    <ListItem
                      key={st.name}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label={`Remove ${st.name}`}
                          onClick={() => setConfirmDeleteType(st.name)}
                          disabled={removingType === st.name}
                        >
                          {removingType === st.name ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteOutlineRoundedIcon />
                          )}
                        </IconButton>
                      }
                      sx={{
                        borderRadius: 2,
                        mb: 0.5,
                        pr: 7,
                        bgcolor: "action.hover",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                bgcolor: st.color,
                                border: (t) => `1px solid ${alpha(t.palette.common.white, 0.12)}`,
                              }}
                            />
                            <span>{st.name}</span>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "flex-start" }}>
                <TextField
                  label="New soda variant name"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  sx={{ flex: "1 1 160px" }}
                />
                <TextField
                  label="Color"
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  sx={{
                    width: 96,
                    "& input": { height: 40, p: 0.5, cursor: "pointer" },
                  }}
                  InputLabelProps={{ shrink: true }}
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleAddSodaType}
                  disabled={addingType}
                  sx={{ height: 56, px: 2 }}
                >
                  {addingType ? <CircularProgress size={22} color="inherit" /> : "Add type"}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        {step === "admin" && (
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose} color="inherit">
              Done
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Dialog
        open={editUsername !== null}
        onClose={savingStats ? undefined : () => setEditUsername(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Edit stats{editUsername ? ` — ${displayName(editUsername)}` : ""}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Sodas taken"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={editTaken}
              onChange={(e) => setEditTaken(e.target.value)}
              fullWidth
            />
            <TextField
              label="Sodas contributed"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={editRefilled}
              onChange={(e) => setEditRefilled(e.target.value)}
              fullWidth
            />
            <TextField
              label="Refill spend (SEK)"
              type="number"
              inputProps={{ min: 0, step: "0.01", inputMode: "decimal" }}
              value={editRefillSpend}
              onChange={(e) => setEditRefillSpend(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditUsername(null)} color="inherit" disabled={savingStats}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStats}
            disabled={savingStats}
            startIcon={
              savingStats ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={stockEditOpen}
        onClose={savingStock ? undefined : () => setStockEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TuneRoundedIcon color="primary" fontSize="small" />
          Set stock counts
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Override the remaining count for each soda. Useful for corrections — e.g. when a few cans go missing.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            {sodaTypes.map((st) => (
              <TextField
                key={st.name}
                label={st.name}
                type="number"
                inputProps={{ min: 0, step: 1, inputMode: "numeric" }}
                value={stockDraft[st.name] ?? ""}
                onChange={(e) =>
                  setStockDraft((prev) => ({ ...prev, [st.name]: e.target.value }))
                }
                fullWidth
                InputProps={{
                  startAdornment: (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: st.color,
                        mr: 1,
                        flexShrink: 0,
                        border: (t) => `1px solid ${alpha(t.palette.common.white, 0.12)}`,
                      }}
                    />
                  ),
                }}
              />
            ))}
            {sodaTypes.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No soda types yet. Add one first.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setStockEditOpen(false)}
            color="inherit"
            disabled={savingStock}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveStock}
            disabled={savingStock || sodaTypes.length === 0}
            startIcon={
              savingStock ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDeleteType !== null}
        onClose={() => setConfirmDeleteType(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove soda variant</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>{confirmDeleteType}</strong>? This will also
            remove its stock count.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDeleteType(null)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleRemoveSodaType}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
