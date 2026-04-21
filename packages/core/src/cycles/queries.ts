import { getApiClient } from "../api/connect-client";

export interface Cycle {
  id: string;
  workspace_id: string;
  number: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  auto_create_next: boolean;
  created_at: string;
  updated_at: string;
}

export async function listCycles(workspaceId: string): Promise<{ cycles: Cycle[] }> {
  return getApiClient().call("/rpc/cycle/list", { workspace_id: workspaceId });
}

export async function getCycle(workspaceId: string, cycleId: string): Promise<Cycle> {
  return getApiClient().call("/rpc/cycle/get", { workspace_id: workspaceId, cycle_id: cycleId });
}

export async function createCycle(data: {
  workspace_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  auto_create_next?: boolean;
}): Promise<Cycle> {
  return getApiClient().call("/rpc/cycle/create", data);
}

export async function updateCycle(
  workspaceId: string,
  cycleId: string,
  data: Record<string, unknown>
): Promise<Cycle> {
  return getApiClient().call("/rpc/cycle/update", { workspace_id: workspaceId, cycle_id: cycleId, ...data });
}

export async function deleteCycle(workspaceId: string, cycleId: string): Promise<void> {
  await getApiClient().call("/rpc/cycle/delete", { workspace_id: workspaceId, cycle_id: cycleId });
}

export async function addIssueToCycle(workspaceId: string, cycleId: string, issueId: string): Promise<void> {
  await getApiClient().call("/rpc/cycle/add-issue", { workspace_id: workspaceId, cycle_id: cycleId, issue_id: issueId });
}

export async function removeIssueFromCycle(workspaceId: string, cycleId: string, issueId: string): Promise<void> {
  await getApiClient().call("/rpc/cycle/remove-issue", { workspace_id: workspaceId, cycle_id: cycleId, issue_id: issueId });
}

export async function getCycleIssues(workspaceId: string, cycleId: string): Promise<{ issues: any[] }> {
  return getApiClient().call("/rpc/cycle/issues", { workspace_id: workspaceId, cycle_id: cycleId });
}
