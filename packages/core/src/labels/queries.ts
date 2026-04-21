import { getApiClient } from "../api/connect-client";

export interface Label {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export async function listLabels(workspaceId: string): Promise<{ labels: Label[] }> {
  return getApiClient().call("/rpc/label/list", { workspace_id: workspaceId });
}

export async function createLabel(data: {
  workspace_id: string;
  name: string;
  description?: string;
  color?: string;
}): Promise<Label> {
  return getApiClient().call("/rpc/label/create", data);
}

export async function updateLabel(
  workspaceId: string,
  labelId: string,
  data: Record<string, unknown>
): Promise<Label> {
  return getApiClient().call("/rpc/label/update", { workspace_id: workspaceId, label_id: labelId, ...data });
}

export async function deleteLabel(workspaceId: string, labelId: string): Promise<void> {
  await getApiClient().call("/rpc/label/delete", { workspace_id: workspaceId, label_id: labelId });
}

export async function addLabelToIssue(workspaceId: string, issueId: string, labelId: string): Promise<void> {
  await getApiClient().call("/rpc/label/add-to-issue", { workspace_id: workspaceId, issue_id: issueId, label_id: labelId });
}

export async function removeLabelFromIssue(workspaceId: string, issueId: string, labelId: string): Promise<void> {
  await getApiClient().call("/rpc/label/remove-from-issue", { workspace_id: workspaceId, issue_id: issueId, label_id: labelId });
}

export async function getIssueLabels(workspaceId: string, issueId: string): Promise<{ labels: Label[] }> {
  return getApiClient().call("/rpc/label/issue-labels", { workspace_id: workspaceId, issue_id: issueId });
}
