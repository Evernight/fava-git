import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJSON, postJSON } from "./api";

export const gitStatusQueryKey = ["git", "status"] as const;

export interface GitFileStatus {
  path: string;
  indexStatus: string;
  workTreeStatus: string;
  renameOrCopy: string | null;
}

export interface StatusResponse {
  root: string;
  files: GitFileStatus[];
  head?: string | null;
  remote?: string | null;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  subject: string;
}

export interface LogResponse {
  commits: GitCommit[];
}

export function useGitStatus() {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `status?${q}` : "status";
  return useQuery({
    queryKey: [...gitStatusQueryKey, url],
    queryFn: () => fetchJSON<StatusResponse>(url),
  });
}

export function useGitLog(n = 10, enabled = true) {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `log?n=${n}&${q}` : `log?n=${n}`;
  return useQuery({
    queryKey: [...gitStatusQueryKey, "log", n, url],
    queryFn: () => fetchJSON<LogResponse>(url),
    enabled,
  });
}

export function useGitReflog(n = 5, enabled = true) {
  const params = new URLSearchParams(location.search);
  const q = params.toString();
  const url = q ? `reflog?n=${n}&${q}` : `reflog?n=${n}`;
  return useQuery({
    queryKey: [...gitStatusQueryKey, "reflog", n, url],
    queryFn: () => fetchJSON<LogResponse>(url),
    enabled,
  });
}

export function useStageFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => postJSON<{ path: string }>("stage", { path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function useUnstageFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => postJSON<{ path: string }>("unstage", { path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => postJSON<{ path: string }>("delete", { path }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function useCreateCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => postJSON<{ hash: string }>("commit", { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ref: string) => postJSON<{ ref: string }>("checkout", { ref }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function useInitRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJSON<{ root: string }>("init", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function usePull() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJSON<{ output: string }>("pull", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}

export function usePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => postJSON<{ output: string }>("push", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gitStatusQueryKey });
    },
  });
}
