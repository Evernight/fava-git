import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import type { GitCommit } from "../api/status";

function CommitRow({ commit }: { commit: GitCommit }) {
  return (
    <ListItem sx={{ flexDirection: "column", alignItems: "stretch", py: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
        {commit.shortHash} · {commit.author} · {commit.date.slice(0, 10)}
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
}: {
  loading: boolean;
  error: Error | null;
  commits: GitCommit[];
}) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        Commit history
      </Typography>
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
              <CommitRow key={commit.hash} commit={commit} />
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
