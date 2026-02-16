import {
  Alert,
  Box,
  CircularProgress,
  Link,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import type { GitCommit } from "../api/status";

function CommitRow({
  commit,
  onCheckout,
  isCheckingOut,
}: {
  commit: GitCommit;
  onCheckout: (hash: string) => void;
  isCheckingOut: (hash: string) => boolean;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      window.confirm(
        `Checkout commit ${commit.shortHash}? This will switch to detached HEAD state.`,
      )
    ) {
      onCheckout(commit.hash);
    }
  };

  return (
    <ListItem sx={{ flexDirection: "column", alignItems: "stretch", py: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
        <Link
          component="button"
          variant="inherit"
          onClick={handleClick}
          sx={{
            cursor: isCheckingOut(commit.hash) ? "wait" : "pointer",
            textDecoration: "underline",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {commit.shortHash}
        </Link>{" "}
        · {commit.author} · {commit.date.slice(0, 16)}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {commit.subject}
      </Typography>
    </ListItem>
  );
}

export function CommitHistory({
  loading,
  error,
  commits,
  onCheckout,
  isCheckingOut,
  checkoutError,
}: {
  loading: boolean;
  error: Error | null;
  commits: GitCommit[];
  onCheckout: (hash: string) => void;
  isCheckingOut: (hash: string) => boolean;
  checkoutError?: Error | null;
}) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        Commit history
      </Typography>
      {checkoutError && (
        <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
          {String(checkoutError)}
        </Alert>
      )}
      <Box sx={{ overflow: "auto", flex: 1 }}>
        {loading ? (
          <Box sx={{ py: 2, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {String(error)}
          </Alert>
        ) : commits.length ? (
          <List dense disablePadding>
            {commits.map((commit) => (
              <CommitRow
                key={commit.hash}
                commit={commit}
                onCheckout={onCheckout}
                isCheckingOut={isCheckingOut}
              />
            ))}
          </List>
        ) : (
          <Box sx={{ py: 2, px: 2, color: "text.secondary", textAlign: "center" }}>
            No commits
          </Box>
        )}
      </Box>
    </Paper>
  );
}
