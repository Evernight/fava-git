"""Git operations using subprocess.check_output."""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class GitFileStatus:
    """A single file with its git status."""

    path: str
    index_status: str
    work_tree_status: str
    rename_or_copy: str | None  # e.g. "file.beancount" for R100 or C100


@dataclass(frozen=True)
class GitCommit:
    """A single commit from git log."""

    hash: str  # full commit hash
    short_hash: str
    author: str
    date: str
    subject: str

    def to_dict(self) -> dict:
        """Convert to API response format (camelCase keys)."""
        return {
            "hash": self.hash,
            "shortHash": self.short_hash,
            "author": self.author,
            "date": self.date,
            "subject": self.subject,
        }


def _run_git(working_dir: Path, *args: str) -> str:
    """Run a git command and return stdout as string."""
    return subprocess.check_output(
        ["git", *args],
        cwd=working_dir,
        text=True,
    ).strip()


def is_git_repo(working_dir: Path) -> bool:
    """Return True if working_dir is inside a git repository."""
    try:
        _run_git(working_dir, "rev-parse", "--is-inside-work-tree")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def init_repo(working_dir: Path) -> None:
    """Initialize a new git repository in working_dir."""
    subprocess.check_output(["git", "init"], cwd=working_dir, text=True)


def get_root(working_dir: Path) -> str:
    """Return the git repository root path (absolute)."""
    return _run_git(working_dir, "rev-parse", "--show-toplevel")


def get_log(working_dir: Path, n: int = 50) -> list[GitCommit]:
    """Return commit history from git log."""
    try:
        out = subprocess.check_output(
            ["git", "log", f"-n{n}", "--format=%H%x00%h%x00%an%x00%ai%x00%s", "--date=iso"],
            cwd=working_dir,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    commits: list[GitCommit] = []
    for line in out.strip().split("\n"):
        if not line:
            continue
        parts = line.split("\0")
        if len(parts) >= 5:
            commits.append(
                GitCommit(
                    hash=parts[0],
                    short_hash=parts[1],
                    author=parts[2],
                    date=parts[3],
                    subject=parts[4],
                )
            )
    return commits


def get_reflog(working_dir: Path, n: int = 5) -> list[GitCommit]:
    """Return recent reflog entries (HEAD movements)."""
    try:
        out = subprocess.check_output(
            ["git", "log", "-g", f"-n{n}", "--format=%H%x00%h%x00%an%x00%ai%x00%gs", "--date=iso"],
            cwd=working_dir,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    commits: list[GitCommit] = []
    for line in out.strip().split("\n"):
        if not line:
            continue
        parts = line.split("\0")
        if len(parts) >= 5:
            commits.append(
                GitCommit(
                    hash=parts[0],
                    short_hash=parts[1],
                    author=parts[2],
                    date=parts[3],
                    subject=parts[4],
                )
            )
    return commits


def status_porcelain(working_dir: Path) -> list[GitFileStatus]:
    """Run 'git status --porcelain -z' and return parsed file statuses.

    Porcelain -z: NUL-separated. Each entry is "XY path" or "R  score path";
    for R/C the next NUL-separated value is the second path.
    """
    try:
        out = subprocess.check_output(
            ["git", "status", "--porcelain", "-z"],
            cwd=working_dir,
            text=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []

    entries: list[GitFileStatus] = []
    parts = [p for p in out.split("\0") if p]
    i = 0
    while i < len(parts):
        chunk = parts[i]
        if len(chunk) < 2:
            i += 1
            continue
        index_status = chunk[0]
        work_tree_status = chunk[1]
        rest = chunk[2:].lstrip()
        # Optional "score " for rename/copy (e.g. "100 oldpath")
        path1 = rest
        if rest and rest[0].isdigit():
            space = rest.find(" ")
            if space != -1:
                path1 = rest[space + 1 :].lstrip()
        rename_or_copy = None
        if path1 and index_status in ("R", "C") and i + 1 < len(parts):
            rename_or_copy = parts[i + 1]
            i += 1
        if path1:
            entries.append(
                GitFileStatus(
                    path=path1,
                    index_status=index_status,
                    work_tree_status=work_tree_status,
                    rename_or_copy=rename_or_copy,
                )
            )
        i += 1
    return entries


def _check_path_in_repo(working_dir: Path, path: str) -> Path:
    """Resolve path relative to working_dir; raise ValueError if outside repo."""
    resolved = (working_dir / path).resolve()
    try:
        resolved.relative_to(working_dir)
    except ValueError:
        raise ValueError("Path must be inside the repository") from None
    return resolved


def stage_file(working_dir: Path, path: str) -> None:
    """Stage a file with 'git add'."""
    _check_path_in_repo(working_dir, path)
    subprocess.check_output(["git", "add", path], cwd=working_dir, text=True)


def unstage_file(working_dir: Path, path: str) -> None:
    """Unstage a file with 'git reset HEAD'."""
    _check_path_in_repo(working_dir, path)
    subprocess.check_output(["git", "reset", "HEAD", "--", path], cwd=working_dir, text=True)


def create_commit(working_dir: Path, message: str) -> str:
    """Create a commit with the given message. Returns the new commit hash."""
    msg = (message or "").strip()
    if not msg:
        raise ValueError("Commit message is required")
    out = subprocess.check_output(
        ["git", "commit", "-m", msg],
        cwd=working_dir,
        text=True,
    )
    # "[main abc1234] Update 2025-02-10\n 1 file changed..."
    for line in out.split("\n"):
        line = line.strip()
        if line.startswith("[") and "]" in line:
            part = line.split("]")[0]
            parts = part.split()
            if len(parts) >= 2:
                return parts[1]  # short hash
    return ""


def checkout(working_dir: Path, ref: str) -> None:
    """Checkout a commit (detached HEAD)."""
    if not ref or not ref.strip():
        raise ValueError("Commit ref is required")
    # Use rev-parse to validate the ref exists
    subprocess.check_output(
        ["git", "rev-parse", "--verify", ref.strip()],
        cwd=working_dir,
        text=True,
    )
    subprocess.check_output(
        ["git", "checkout", ref.strip()],
        cwd=working_dir,
        text=True,
    )


def delete_file(working_dir: Path, path: str) -> None:
    """Remove file from working tree: git rm for tracked, os.remove for untracked."""
    full = _check_path_in_repo(working_dir, path)
    try:
        subprocess.check_output(["git", "rm", path], cwd=working_dir, text=True)
    except subprocess.CalledProcessError:
        if full.exists():
            os.remove(full)
        else:
            raise  # e.g. already deleted or permission error
