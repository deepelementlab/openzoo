import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRuntimes, registerRuntime, getRuntime, pingRuntime, listRuntimeUsage } from "../runtimes/queries";
import { updateRuntime, deleteRuntime } from "../runtimes/mutations";
import type { RuntimeDevice } from "../types";

export function useRuntimes(workspaceId: string) {
  return useQuery({
    queryKey: ["runtimes", workspaceId],
    queryFn: () => listRuntimes(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useRuntime(workspaceId: string, runtimeId: string) {
  return useQuery({
    queryKey: ["runtime", workspaceId, runtimeId],
    queryFn: () => getRuntime(workspaceId, runtimeId),
    enabled: !!workspaceId && !!runtimeId,
  });
}

export function useRegisterRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof registerRuntime>[0]) => registerRuntime(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspace_id] });
    },
  });
}

export function useUpdateRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateRuntime>[0]) => updateRuntime(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspace_id] });
      qc.invalidateQueries({ queryKey: ["runtime", vars.workspace_id, vars.runtime_id] });
    },
  });
}

export function useDeleteRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, runtimeId }: { workspaceId: string; runtimeId: string }) =>
      deleteRuntime(workspaceId, runtimeId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspaceId] });
    },
  });
}

export function useRuntimeUsage(workspaceId: string, runtimeId: string, days = 30) {
  return useQuery({
    queryKey: ["runtime-usage", workspaceId, runtimeId, days],
    queryFn: () => listRuntimeUsage(workspaceId, runtimeId, days),
    enabled: !!workspaceId && !!runtimeId,
  });
}

export function usePingRuntime() {
  return useMutation({
    mutationFn: ({ workspaceId, runtimeId }: { workspaceId: string; runtimeId: string }) =>
      pingRuntime(workspaceId, runtimeId),
  });
}
