import { getApiClient, getWorkspaceId } from "../api/connect-client";
import type { PinnedItem } from "../types";

export const pinKeys = {
  all: ["pins"] as const,
  list: () => ["pins", "list"] as const,
};

export async function listPins(): Promise<PinnedItem[]> {
  const res = await getApiClient().call<{ pins: PinnedItem[] }>("/rpc/pin/list", { workspace_id: getWorkspaceId() });
  return res.pins ?? [];
}

export function pinListOptions() {
  return {
    queryKey: pinKeys.list(),
    queryFn: () => listPins(),
  };
}
