import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProjects, getProject, createProject, updateProject, deleteProject } from "../projects/queries";
import type { Project } from "../types";

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => listProjects({ workspace_id: workspaceId }),
    enabled: !!workspaceId,
    select: (data) => ({ projects: data.projects ?? [], total: data.total ?? 0 }),
  });
}

export function useProject(workspaceId: string, projectId: string) {
  return useQuery({
    queryKey: ["project", workspaceId, projectId],
    queryFn: () => getProject(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspace_id] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId, data }: { workspaceId: string; projectId: string; data: Record<string, unknown> }) =>
      updateProject(workspaceId, projectId, data),
    onMutate: async ({ workspaceId, projectId, data }) => {
      await qc.cancelQueries({ queryKey: ["projects", workspaceId] });
      const previous = qc.getQueryData<{ projects: Project[] }>(["projects", workspaceId]);
      if (previous) {
        qc.setQueryData(["projects", workspaceId], {
          ...previous,
          projects: previous.projects.map((p) => (p.id === projectId ? { ...p, ...data } : p)),
        });
      }
      return { previous };
    },
    onError: (_err, vars, ctx: any) => {
      if (ctx?.previous) {
        qc.setQueryData(["projects", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["project", vars.workspaceId, vars.projectId] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, projectId }: { workspaceId: string; projectId: string }) =>
      deleteProject(workspaceId, projectId),
    onMutate: async ({ workspaceId, projectId }) => {
      await qc.cancelQueries({ queryKey: ["projects", workspaceId] });
      const previous = qc.getQueryData<{ projects: Project[] }>(["projects", workspaceId]);
      if (previous) {
        qc.setQueryData(["projects", workspaceId], {
          ...previous,
          projects: previous.projects.filter((p) => p.id !== projectId),
        });
      }
      return { previous };
    },
    onError: (_err, vars, ctx: any) => {
      if (ctx?.previous) {
        qc.setQueryData(["projects", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspaceId] });
    },
  });
}
