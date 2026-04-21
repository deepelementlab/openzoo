import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAgents, getAgent, createAgent, updateAgent, archiveAgent, restoreAgent, setAgentSkills, listSkills, createSkill, updateSkill, deleteSkill } from "../agents/queries";
import type { Agent, Skill } from "../types";

export function useAgents(workspaceId: string) {
  return useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgents(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useAgent(workspaceId: string, agentId: string) {
  return useQuery({
    queryKey: ["agent", workspaceId, agentId],
    queryFn: () => getAgent(workspaceId, agentId),
    enabled: !!workspaceId && !!agentId,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAgent,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspace_id] });
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, agentId, data }: { workspaceId: string; agentId: string; data: Record<string, unknown> }) =>
      updateAgent(workspaceId, agentId, data),
    onMutate: async ({ workspaceId, agentId, data }) => {
      await qc.cancelQueries({ queryKey: ["agents", workspaceId] });
      const previous = qc.getQueryData<Agent[]>(["agents", workspaceId]);
      if (previous) {
        qc.setQueryData(["agents", workspaceId], previous.map((a) => (a.id === agentId ? { ...a, ...data } : a)));
      }
      return { previous };
    },
    onError: (_err, vars, ctx: any) => {
      if (ctx?.previous) {
        qc.setQueryData(["agents", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["agent", vars.workspaceId, vars.agentId] });
    },
  });
}

export function useArchiveAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, agentId }: { workspaceId: string; agentId: string }) =>
      archiveAgent(workspaceId, agentId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
    },
  });
}

export function useRestoreAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, agentId }: { workspaceId: string; agentId: string }) =>
      restoreAgent(workspaceId, agentId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
    },
  });
}

export function useSkills(workspaceId: string) {
  return useQuery({
    queryKey: ["skills", workspaceId],
    queryFn: () => listSkills(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspace_id] });
    },
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, skillId, data }: { workspaceId: string; skillId: string; data: Record<string, unknown> }) =>
      updateSkill(workspaceId, skillId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspaceId] });
    },
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, skillId }: { workspaceId: string; skillId: string }) =>
      deleteSkill(workspaceId, skillId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspaceId] });
    },
  });
}
