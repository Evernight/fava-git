"""Fava extension for managing Beancount files with git."""

from __future__ import annotations

import functools
import subprocess
import traceback
from pathlib import Path

from fava.ext import FavaExtensionBase
from fava.ext import extension_endpoint
from fava.helpers import FavaAPIError
from flask import request

from .git_ops import create_commit
from .git_ops import delete_file
from .git_ops import GitCommit
from .git_ops import GitFileStatus
from .git_ops import get_log
from .git_ops import get_root
from .git_ops import init_repo
from .git_ops import is_git_repo
from .git_ops import stage_file
from .git_ops import status_porcelain
from .git_ops import unstage_file


def api_response(func):
    """Return {success: true, data: ...} or {success: false, error: ...}."""

    @functools.wraps(func)
    def decorator(*args, **kwargs):
        try:
            data = func(*args, **kwargs)
            return {"success": True, "data": data}
        except FavaAPIError as e:
            return {"success": False, "error": e.message}, 500
        except Exception as e:  # pylint: disable=broad-exception-caught
            traceback.print_exception(e)
            return {"success": False, "error": str(e)}, 500

    return decorator


def _file_status_to_dict(s: GitFileStatus) -> dict:
    return {
        "path": s.path,
        "indexStatus": s.index_status,
        "workTreeStatus": s.work_tree_status,
        "renameOrCopy": s.rename_or_copy,
    }


class FavaGit(FavaExtensionBase):
    report_title = "Git"
    has_js_module = True

    def _working_dir(self) -> Path:
        """Directory containing the main beancount file (git working directory)."""
        return Path(self.ledger.beancount_file_path).parent.resolve()

    @extension_endpoint("init", methods=["POST"])
    @api_response
    def api_init(self) -> dict:
        """Initialize a git repository in the directory of the main beancount file."""
        working_dir = self._working_dir()
        if is_git_repo(working_dir):
            raise FavaAPIError("Already a git repository")
        init_repo(working_dir)
        return {"root": str(working_dir)}

    @extension_endpoint("status")
    @api_response
    def api_status(self) -> dict:
        """Return git repo root and list of files with status (porcelain)."""
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")

        root = get_root(working_dir)
        files = status_porcelain(working_dir)
        return {
            "root": root,
            "files": [_file_status_to_dict(f) for f in files],
        }

    @extension_endpoint("log")
    @api_response
    def api_log(self) -> dict:
        """Return commit history (git log)."""
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")
        n = request.args.get("n", "50", type=int)
        n = min(max(1, n), 200)
        commits = get_log(working_dir, n=n)
        return {"commits": [c.to_dict() for c in commits]}

    @extension_endpoint("commit", methods=["POST"])
    @api_response
    def api_commit(self) -> dict:
        """Create a new commit with the given message."""
        payload = request.get_json(silent=True) or {}
        message = (payload.get("message") or "").strip()
        if not message:
            raise FavaAPIError("Commit message is required")
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")
        try:
            commit_hash = create_commit(working_dir, message)
        except ValueError as e:
            raise FavaAPIError(str(e)) from e
        except subprocess.CalledProcessError as e:
            if e.output:
                raise FavaAPIError(e.output.strip() or "Nothing to commit") from e
            raise FavaAPIError("Commit failed") from e
        return {"hash": commit_hash}

    @extension_endpoint("stage", methods=["POST"])
    @api_response
    def api_stage(self) -> dict:
        """Stage a file (git add)."""
        payload = request.get_json(silent=True) or {}
        path = (payload.get("path") or "").strip()
        if not path:
            raise FavaAPIError("Missing path")
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")
        try:
            stage_file(working_dir, path)
        except ValueError as e:
            raise FavaAPIError(str(e)) from e
        return {"path": path}

    @extension_endpoint("unstage", methods=["POST"])
    @api_response
    def api_unstage(self) -> dict:
        """Unstage a file (git reset HEAD)."""
        payload = request.get_json(silent=True) or {}
        path = (payload.get("path") or "").strip()
        if not path:
            raise FavaAPIError("Missing path")
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")
        try:
            unstage_file(working_dir, path)
        except ValueError as e:
            raise FavaAPIError(str(e)) from e
        return {"path": path}

    @extension_endpoint("delete", methods=["POST"])
    @api_response
    def api_delete(self) -> dict:
        """Remove file from working tree (git rm or delete untracked)."""
        payload = request.get_json(silent=True) or {}
        path = (payload.get("path") or "").strip()
        if not path:
            raise FavaAPIError("Missing path")
        working_dir = self._working_dir()
        if not is_git_repo(working_dir):
            raise FavaAPIError("Not a git repository")
        try:
            delete_file(working_dir, path)
        except ValueError as e:
            raise FavaAPIError(str(e)) from e
        return {"path": path}
