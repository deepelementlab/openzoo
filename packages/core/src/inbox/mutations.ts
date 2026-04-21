import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient, getWorkspaceId } from "../api/connect-client";
import { inboxKeys } from "./queries";

export function useMarkInboxRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return getApiClient().call("/rpc/inbox/mark-read", {
        workspace_id: getWorkspaceId(),
        item_ids: ids,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}

export function useArchiveInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return getApiClient().call("/rpc/inbox/mark-archived", {
        workspace_id: getWorkspaceId(),
        item_ids: ids,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}

export function useMarkAllInboxRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return getApiClient().call("/rpc/inbox/mark-all-read", {
        workspace_id: getWorkspaceId(),
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}

export function useArchiveAllInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return getApiClient().call("/rpc/inbox/mark-archived", {
        workspace_id: getWorkspaceId(),
        archive_all: true,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}

export function useArchiveAllReadInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return getApiClient().call("/rpc/inbox/mark-archived", {
        workspace_id: getWorkspaceId(),
        archive_read: true,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}

export function useArchiveCompletedInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return getApiClient().call("/rpc/inbox/mark-archived", {
        workspace_id: getWorkspaceId(),
        archive_completed: true,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: inboxKeys.list() }),
  });
}
