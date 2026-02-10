import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GitFileStatus } from "../api/status";

function statusLabel(index: string, workTree: string): string {
  const i = index !== " " ? index : "";
  const w = workTree !== " " ? workTree : "";
  const both = (i + w).trim() || "clean";
  const labels: Record<string, string> = {
    M: "Modified",
    A: "Added",
    D: "Deleted",
    R: "Renamed",
    C: "Copied",
    U: "Updated",
    "?": "Untracked",
    "??": "Untracked",
    "!": "Ignored",
    MM: "Modified (staged + unstaged)",
    AM: "Added (modified)",
    MD: "Modified (deleted)",
  };
  return labels[both] ?? both;
}

function StatusChip({ indexStatus, workTreeStatus }: { indexStatus: string; workTreeStatus: string }) {
  const label = statusLabel(indexStatus, workTreeStatus);
  const severity =
    label === "Added"
      ? "success"
      : indexStatus === "?" || workTreeStatus === "?"
        ? "default"
        : indexStatus !== " " || workTreeStatus !== " "
          ? "warning"
          : "default";
  return <Chip size="small" label={label} color={severity} variant="outlined" />;
}

function FileRow({
  file,
  onStage,
  onUnstage,
  onDelete,
  isStaging,
  isUnstaging,
  isDeleting,
}: {
  file: GitFileStatus;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDelete: (path: string) => void;
  isStaging: (path: string) => boolean;
  isUnstaging: (path: string) => boolean;
  isDeleting: (path: string) => boolean;
}) {
  const secondary = file.renameOrCopy ? `→ ${file.renameOrCopy}` : null;
  const staging = isStaging(file.path);
  const unstaging = isUnstaging(file.path);
  const deleting = isDeleting(file.path);
  const isStaged = ![" ", "?", "!"].includes(file.indexStatus);
  const busy = staging || unstaging || deleting;
  return (
    <ListItem sx={{ alignItems: "flex-start" }}>
      <ListItemText
        primary={file.path}
        secondary={secondary}
        primaryTypographyProps={{
          fontFamily: "monospace",
          variant: "body2",
          ...(isStaged && { color: "success.main" }),
        }}
        secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
      />
      <Box sx={{ ml: "auto", flexShrink: 0, alignSelf: "center", display: "flex", alignItems: "center", gap: 0 }}>
        {isStaged ? (
          <Tooltip title="Unstage file">
            <span>
              <IconButton
                size="small"
                aria-label="Unstage file"
                onClick={() => onUnstage(file.path)}
                disabled={busy}
              >
                <RemoveCircleOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title="Stage file">
            <span>
              <IconButton
                size="small"
                aria-label="Stage file"
                onClick={() => onStage(file.path)}
                disabled={busy}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Delete file">
          <span>
            <IconButton
              size="small"
              aria-label="Delete file"
              onClick={() => onDelete(file.path)}
              disabled={busy}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <StatusChip indexStatus={file.indexStatus} workTreeStatus={file.workTreeStatus} />
      </Box>
    </ListItem>
  );
}

export function FileStatus({
  files,
  onStage,
  onUnstage,
  onDelete,
  isStaging,
  isUnstaging,
  isDeleting,
}: {
  files: GitFileStatus[];
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onDelete: (path: string) => void;
  isStaging: (path: string) => boolean;
  isUnstaging: (path: string) => boolean;
  isDeleting: (path: string) => boolean;
}) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <Typography variant="subtitle2" sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        File status
      </Typography>
      <Box sx={{ overflow: "auto", flex: 1 }}>
        {files.length === 0 ? (
          <Box sx={{ py: 2, px: 2, color: "text.secondary", textAlign: "center" }}>
            Working tree clean
          </Box>
        ) : (
          <List dense disablePadding>
            {files.map((file) => (
              <FileRow
                key={file.path}
                file={file}
                onStage={onStage}
                onUnstage={onUnstage}
                onDelete={onDelete}
                isStaging={isStaging}
                isUnstaging={isUnstaging}
                isDeleting={isDeleting}
              />
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
