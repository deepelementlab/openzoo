import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCycles, getCycle, createCycle, updateCycle, deleteCycle, addIssueToCycle, removeIssueFromCycle } from "./queries";

export function useCycles(workspaceId: string) {
  return useQuery({
    queryKey: ["cycles", workspaceId],
    queryFn: () => listCycles(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.cycles ?? [],
  });
}

export function useCycle(workspaceId: string, cycleId: string) {
  return useQuery({
    queryKey: ["cycle", workspaceId, cycleId],
    queryFn: () => getCycle(workspaceId, cycleId),
    enabled: !!workspaceId && !!cycleId,
  });
}

export function useCreateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCycle,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspace_id] });
    },
  });
}

export function useUpdateCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, cycleId, data }: { workspaceId: string; cycleId: string; data: Record<string, unknown> }) =>
      updateCycle(workspaceId, cycleId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    },
  });
}

export function useDeleteCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, cycleId }: { workspaceId: string; cycleId: string }) =>
      deleteCycle(workspaceId, cycleId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspaceId] });
    },
  });
}

export function useAddIssueToCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, cycleId, issueId }: { workspaceId: string; cycleId: string; issueId: string }) =>
      addIssueToCycle(workspaceId, cycleId, issueId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    },
  });
}

export function useRemoveIssueFromCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, cycleId, issueId }: { workspaceId: string; cycleId: string; issueId: string }) =>
      removeIssueFromCycle(workspaceId, cycleId, issueId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    },
  });
}
