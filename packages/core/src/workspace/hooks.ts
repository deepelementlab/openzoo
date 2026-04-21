import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, listMembers, createMember, updateMember, deleteMember } from "../workspace/queries";
import type { Workspace, MemberWithUser } from "../types";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    staleTime: 1000 * 60 * 30,
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: Record<string, unknown> }) =>
      updateWorkspace(workspaceId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      qc.invalidateQueries({ queryKey: ["workspace", vars.workspaceId] });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listMembers(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role?: string }) =>
      createMember(workspaceId, email, role),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, memberId, role }: { workspaceId: string; memberId: string; role: string }) =>
      updateMember(workspaceId, memberId, role),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) =>
      deleteMember(workspaceId, memberId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    },
  });
}
