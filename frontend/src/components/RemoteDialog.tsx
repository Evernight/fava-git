import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { usePull, usePush } from "../api/status";

export function RemoteDialog({
  open,
  onClose,
  remote,
}: {
  open: boolean;
  onClose: () => void;
  remote?: string | null;
}) {
  const pullMutation = usePull();
  const pushMutation = usePush();

  const handleClose = () => {
    pullMutation.reset();
    pushMutation.reset();
    onClose();
  };

  const handlePull = () => {
    pushMutation.reset();
    pullMutation.mutate();
  };

  const handlePush = () => {
    pullMutation.reset();
    pushMutation.mutate();
  };

  const isPending = pullMutation.isPending || pushMutation.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remote Operations</DialogTitle>
      <DialogContent dividers>
        {!remote ? (
          <Alert severity="info">No remote configured for this repository.</Alert>
        ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Remote: <strong>{remote}</strong>
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handlePull}
              disabled={isPending}
              startIcon={pullMutation.isPending ? <CircularProgress size={16} /> : undefined}
            >
              {pullMutation.isPending ? "Pulling…" : "Pull"}
            </Button>
            <Button
              variant="outlined"
              onClick={handlePush}
              disabled={isPending}
              startIcon={pushMutation.isPending ? <CircularProgress size={16} /> : undefined}
            >
              {pushMutation.isPending ? "Pushing…" : "Push"}
            </Button>
          </Box>
          {pullMutation.isSuccess && (
            <Alert severity="success">
              <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0 }}>
                {pullMutation.data?.output || "Already up to date."}
              </Typography>
            </Alert>
          )}
          {pullMutation.isError && (
            <Alert severity="error">{String(pullMutation.error)}</Alert>
          )}
          {pushMutation.isSuccess && (
            <Alert severity="success">
              <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0 }}>
                {pushMutation.data?.output || "Push successful."}
              </Typography>
            </Alert>
          )}
          {pushMutation.isError && (
            <Alert severity="error">{String(pushMutation.error)}</Alert>
          )}
        </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
