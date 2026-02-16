import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
} from "@mui/material";
import { useState } from "react";
import {
  useCheckout,
  useCreateCommit,
  useDeleteFile,
  useGitLog,
  useGitReflog,
  useGitStatus,
  useInitRepo,
  useStageFile,
  useUnstageFile,
} from "../api/status";
import { CommitHistory } from "./CommitHistory";
import { FileStatus } from "./FileStatus";

function defaultCommitMessage(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Update ${today}`;
}

export function GitDashboard() {
  const [commitMessage, setCommitMessage] = useState(defaultCommitMessage);
  const { data, isLoading, error } = useGitStatus();
  const initMutation = useInitRepo();
  const isNotGitRepo = error && String(error).includes("Not a git repository");
  const { data: logData, isLoading: logLoading, error: logError } = useGitLog(10, !!data);
  const { data: reflogData, isLoading: reflogLoading, error: reflogError } = useGitReflog(5, !!data);
  const stageMutation = useStageFile();
  const unstageMutation = useUnstageFile();
  const deleteMutation = useDeleteFile();
  const commitMutation = useCreateCommit();
  const checkoutMutation = useCheckout();
  const isStaging = (path: string) => stageMutation.isPending && stageMutation.variables === path;
  const isUnstaging = (path: string) => unstageMutation.isPending && unstageMutation.variables === path;
  const isDeleting = (path: string) => deleteMutation.isPending && deleteMutation.variables === path;

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error && !isNotGitRepo) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{String(error)}</Alert>
      </Box>
    );
  }

  if (isNotGitRepo) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          This directory is not a git repository.
        </Alert>
        <Button
          variant="contained"
          onClick={() => initMutation.mutate()}
          disabled={initMutation.isPending}
        >
          {initMutation.isPending ? "Initializing…" : "Initialize git repository"}
        </Button>
        {initMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {String(initMutation.error)}
          </Alert>
        )}
      </Box>
    );
  }

  const handleStage = (path: string) => {
    stageMutation.mutate(path);
  };
  const handleUnstage = (path: string) => {
    unstageMutation.mutate(path);
  };
  const handleDelete = (path: string) => {
    if (window.confirm(`Delete "${path}"?`)) {
      deleteMutation.mutate(path);
    }
  };

  if (!data) {
    return null;
  }

  const handleCommit = () => {
    if (commitMessage.trim()) {
      commitMutation.mutate(commitMessage.trim(), {
        onSuccess: () => setCommitMessage(defaultCommitMessage()),
      });
    }
  };

  const handleCheckout = (hash: string) => {
    checkoutMutation.mutate(hash);
  };

  const isCheckingOut = (hash: string) =>
    checkoutMutation.isPending && checkoutMutation.variables === hash;

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            label="Commit message"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 200 }}
            placeholder="Update YYYY-MM-DD"
            error={!!commitMutation.error}
            helperText={commitMutation.error ? String(commitMutation.error) : undefined}
          />
          <Button
            variant="contained"
            onClick={handleCommit}
            disabled={commitMutation.isPending || !commitMessage.trim()}
          >
            {commitMutation.isPending ? "Committing…" : "Create commit"}
          </Button>
        </Box>
      </Paper>
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, flex: 1, minHeight: 0 }}>
        <FileStatus
          files={data.files}
          onStage={handleStage}
          onUnstage={handleUnstage}
          onDelete={handleDelete}
          isStaging={isStaging}
          isUnstaging={isUnstaging}
          isDeleting={isDeleting}
        />
        <CommitHistory
          loading={logLoading}
          error={logError ?? null}
          commits={logData?.commits ?? []}
          reflogLoading={reflogLoading}
          reflogError={reflogError ?? null}
          reflogCommits={reflogData?.commits ?? []}
          onCheckout={handleCheckout}
          isCheckingOut={isCheckingOut}
          checkoutError={checkoutMutation.error ?? null}
          currentHead={data?.head}
        />
      </Box>
    </Box>
  );
}
