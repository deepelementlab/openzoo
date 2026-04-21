import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discoverExternalSessions, listExternalSessions, monitorExternalSession, adoptExternalSession, releaseExternalSession } from "./queries";

export function useExternalSessions(workspaceId: string) {
  return useQuery({
    queryKey: ["external-sessions", workspaceId],
    queryFn: () => listExternalSessions(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useDiscoverExternalSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => discoverExternalSessions(workspaceId),
    onSuccess: (_, workspaceId) => {
      qc.invalidateQueries({ queryKey: ["external-sessions", workspaceId] });
    },
  });
}

export function useMonitorExternalSession() {
  return useMutation({
    mutationFn: (id: string) => monitorExternalSession(id),
  });
}

export function useAdoptExternalSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, agentId }: { id: string; agentId: string }) => adoptExternalSession(id, agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external-sessions"] });
    },
  });
}

export function useReleaseExternalSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releaseExternalSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["external-sessions"] });
    },
  });
}
