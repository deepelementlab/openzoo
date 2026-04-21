import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listInbox, markInboxRead, markInboxArchived, markAllInboxRead } from "../inbox/queries";

export function useInbox(workspaceId: string, params?: { limit?: number; offset?: number; unread_only?: boolean }) {
  return useQuery({
    queryKey: ["inbox", workspaceId, params],
    queryFn: () => listInbox({ workspace_id: workspaceId, ...params }),
    enabled: !!workspaceId,
  });
}

export function useMarkInboxRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, inboxId }: { workspaceId: string; inboxId: string }) =>
      markInboxRead(workspaceId, [inboxId]),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inbox", vars.workspaceId] });
    },
  });
}

export function useMarkInboxArchived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, inboxId }: { workspaceId: string; inboxId: string }) =>
      markInboxArchived(workspaceId, [inboxId]),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inbox", vars.workspaceId] });
    },
  });
}

export function useMarkAllInboxRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => markAllInboxRead(workspaceId),
    onSuccess: (_, workspaceId) => {
      qc.invalidateQueries({ queryKey: ["inbox", workspaceId] });
    },
  });
}
