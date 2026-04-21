import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listViews, getView, createView, updateView, deleteView } from "./queries";

export function useViews(workspaceId: string) {
  return useQuery({
    queryKey: ["views", workspaceId],
    queryFn: () => listViews(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.views ?? [],
  });
}

export function useView(workspaceId: string, viewId: string) {
  return useQuery({
    queryKey: ["view", workspaceId, viewId],
    queryFn: () => getView(workspaceId, viewId),
    enabled: !!workspaceId && !!viewId,
  });
}

export function useCreateView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createView,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspace_id] });
    },
  });
}

export function useUpdateView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, viewId, data }: { workspaceId: string; viewId: string; data: Record<string, unknown> }) =>
      updateView(workspaceId, viewId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["view", vars.workspaceId, vars.viewId] });
    },
  });
}

export function useDeleteView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, viewId }: { workspaceId: string; viewId: string }) =>
      deleteView(workspaceId, viewId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspaceId] });
    },
  });
}
