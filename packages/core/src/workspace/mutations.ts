import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "../api/connect-client";
import { useWorkspaceStore } from "./store";

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  return useMutation({
    mutationFn: async (params: { name: string; description?: string }) => {
      return getApiClient().call("/rpc/workspace/create", params);
    },
    onSuccess: (data: any) => {
      if (data?.id) setCurrentWorkspace(data);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useLeaveWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      return getApiClient().call("/rpc/workspace/leave", { workspace_id: workspaceId });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      return getApiClient().call("/rpc/workspace/delete", { workspace_id: workspaceId });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}
