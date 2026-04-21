import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adoptExternalSession, releaseExternalSession } from "./queries";

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
