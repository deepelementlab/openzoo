import { getApiClient } from "../api/connect-client";
import type { Project, PinnedItem } from "../types";

export async function listProjects(params: {
  workspace_id: string;
  limit?: number;
  offset?: number;
}): Promise<{ projects: Project[]; total: number }> {
  return getApiClient().call("/rpc/project/list", params);
}

export async function getProject(workspaceId: string, projectId: string): Promise<Project> {
  return getApiClient().call<Project>("/rpc/project/get", { workspace_id: workspaceId, project_id: projectId });
}

export async function createProject(data: {
  workspace_id: string;
  title: string;
  description?: string;
  icon?: string;
  status?: string;
  priority?: string;
  lead_type?: string;
  lead_id?: string;
}): Promise<Project> {
  return getApiClient().call<Project>("/rpc/project/create", data);
}

export async function updateProject(
  workspaceId: string, projectId: string, data: Record<string, unknown>
): Promise<Project> {
  return getApiClient().call<Project>("/rpc/project/update", { workspace_id: workspaceId, project_id: projectId, ...data });
}

export async function deleteProject(workspaceId: string, projectId: string): Promise<void> {
  await getApiClient().call("/rpc/project/delete", { workspace_id: workspaceId, project_id: projectId });
}

export async function searchProjects(
  workspaceId: string, query: string, limit = 20
): Promise<{ results: Project[]; total: number }> {
  return getApiClient().call("/rpc/search/projects", { workspace_id: workspaceId, query, limit });
}

// Pins
export async function listPins(workspaceId: string): Promise<PinnedItem[]> {
  const res = await getApiClient().call<{ items: PinnedItem[] }>("/rpc/pin/list", { workspace_id: workspaceId });
  return res.items ?? [];
}

export async function createPin(workspaceId: string, itemType: string, itemId: string): Promise<PinnedItem> {
  return getApiClient().call<PinnedItem>("/rpc/pin/create", { workspace_id: workspaceId, item_type: itemType, item_id: itemId });
}

export async function deletePin(workspaceId: string, pinId: string): Promise<void> {
  await getApiClient().call("/rpc/pin/delete", { workspace_id: workspaceId, pin_id: pinId });
}

export async function reorderPins(workspaceId: string, items: { id: string; position: number }[]): Promise<void> {
  await getApiClient().call("/rpc/pin/reorder", { workspace_id: workspaceId, items });
}
