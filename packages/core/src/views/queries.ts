import { getApiClient } from "../api/connect-client";

export interface View {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  filters: Record<string, unknown>;
  sort_order: Record<string, unknown>;
  is_shared: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export async function listViews(workspaceId: string): Promise<{ views: View[] }> {
  return getApiClient().call("/rpc/view/list", { workspace_id: workspaceId });
}

export async function getView(workspaceId: string, viewId: string): Promise<View> {
  return getApiClient().call("/rpc/view/get", { workspace_id: workspaceId, view_id: viewId });
}

export async function createView(data: {
  workspace_id: string;
  name: string;
  description?: string;
  filters?: Record<string, unknown>;
  sort_order?: Record<string, unknown>;
  is_shared?: boolean;
}): Promise<View> {
  return getApiClient().call("/rpc/view/create", data);
}

export async function updateView(
  workspaceId: string,
  viewId: string,
  data: Record<string, unknown>
): Promise<View> {
  return getApiClient().call("/rpc/view/update", { workspace_id: workspaceId, view_id: viewId, ...data });
}

export async function deleteView(workspaceId: string, viewId: string): Promise<void> {
  await getApiClient().call("/rpc/view/delete", { workspace_id: workspaceId, view_id: viewId });
}
