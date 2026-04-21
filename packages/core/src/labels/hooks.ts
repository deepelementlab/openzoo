import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listLabels, createLabel, updateLabel, deleteLabel, addLabelToIssue, removeLabelFromIssue, getIssueLabels } from "./queries";

export function useLabels(workspaceId: string) {
  return useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.labels ?? [],
  });
}

export function useIssueLabels(workspaceId: string, issueId: string) {
  return useQuery({
    queryKey: ["issue-labels", workspaceId, issueId],
    queryFn: () => getIssueLabels(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
    select: (data) => data.labels ?? [],
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLabel,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspace_id] });
    },
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, labelId, data }: { workspaceId: string; labelId: string; data: Record<string, unknown> }) =>
      updateLabel(workspaceId, labelId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspaceId] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, labelId }: { workspaceId: string; labelId: string }) =>
      deleteLabel(workspaceId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspaceId] });
    },
  });
}

export function useAddLabelToIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, labelId }: { workspaceId: string; issueId: string; labelId: string }) =>
      addLabelToIssue(workspaceId, issueId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue-labels", vars.workspaceId, vars.issueId] });
    },
  });
}

export function useRemoveLabelFromIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, labelId }: { workspaceId: string; issueId: string; labelId: string }) =>
      removeLabelFromIssue(workspaceId, issueId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue-labels", vars.workspaceId, vars.issueId] });
    },
  });
}
