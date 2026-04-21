import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient, getWorkspaceId } from "../api/connect-client";
import { pinKeys } from "./queries";
import type { PinnedItem } from "../types";

export function useCreatePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { item_type: "issue" | "project"; item_id: string }) => {
      return getApiClient().call("/rpc/pin/create", {
        workspace_id: getWorkspaceId(),
        ...params,
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pinKeys.list() }),
  });
}

export function useDeletePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pinId: string) => {
      return getApiClient().call("/rpc/pin/delete", { id: pinId });
    },
    onMutate: async (pinId: string) => {
      await qc.cancelQueries({ queryKey: pinKeys.list() });
      const prev = qc.getQueryData<PinnedItem[]>(pinKeys.list());
      qc.setQueryData<PinnedItem[]>(pinKeys.list(), (old) =>
        old?.filter((p) => p.id !== pinId) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(pinKeys.list(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pinKeys.list() }),
  });
}

export function useReorderPins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pins: { id: string; position: number }[]) => {
      return getApiClient().call("/rpc/pin/reorder", {
        workspace_id: getWorkspaceId(),
        pins,
      });
    },
    onMutate: async (pins) => {
      await qc.cancelQueries({ queryKey: pinKeys.list() });
      const prev = qc.getQueryData<PinnedItem[]>(pinKeys.list());
      qc.setQueryData<PinnedItem[]>(pinKeys.list(), (old) => {
        if (!old) return old;
        const posMap = new Map(pins.map((p) => [p.id, p.position]));
        return old
          .map((p) => ({ ...p, position: posMap.get(p.id) ?? p.position }))
          .sort((a, b) => a.position - b.position);
      });
      return { prev };
    },
    onError: (_err, _pins, ctx) => {
      if (ctx?.prev) qc.setQueryData(pinKeys.list(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: pinKeys.list() }),
  });
}
