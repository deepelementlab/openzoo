import { getApiClient } from "../api/connect-client";
import type { RuntimeDevice } from "../types";

export async function updateRuntime(data: {
  workspace_id: string;
  runtime_id: string;
  name?: string;
  status?: string;
}): Promise<RuntimeDevice> {
  return getApiClient().call<RuntimeDevice>("/rpc/runtime/update", data);
}

export async function deleteRuntime(workspaceId: string, runtimeId: string): Promise<void> {
  await getApiClient().call("/rpc/runtime/delete", { workspace_id: workspaceId, runtime_id: runtimeId });
}
