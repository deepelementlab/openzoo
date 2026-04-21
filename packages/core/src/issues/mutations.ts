import { getApiClient } from "../api/connect-client";
import type { Issue, IssueReaction, IssueSubscriber } from "../types";

export async function createIssue(data: {
  workspace_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_type?: string;
  assignee_id?: string;
  project_id?: string;
  due_date?: string;
}): Promise<Issue> {
  return getApiClient().call<Issue>("/rpc/issue/create", data);
}

export async function updateIssue(workspaceId: string, issueId: string, data: Record<string, unknown>): Promise<Issue> {
  return getApiClient().call<Issue>("/rpc/issue/update", { workspace_id: workspaceId, issue_id: issueId, ...data });
}

export async function deleteIssue(workspaceId: string, issueId: string): Promise<void> {
  await getApiClient().call("/rpc/issue/delete", { workspace_id: workspaceId, issue_id: issueId });
}

export async function batchUpdateIssues(workspaceId: string, issueIds: string[], data: Record<string, unknown>): Promise<{ issues: Issue[]; updated: number }> {
  return getApiClient().call("/rpc/issue/batch-update", { workspace_id: workspaceId, issue_ids: issueIds, ...data });
}

export async function addIssueReaction(workspaceId: string, issueId: string, emoji: string): Promise<IssueReaction> {
  return getApiClient().call<IssueReaction>("/rpc/issue/add-reaction", { workspace_id: workspaceId, issue_id: issueId, emoji });
}

export async function removeIssueReaction(workspaceId: string, issueId: string, emoji: string): Promise<void> {
  await getApiClient().call("/rpc/issue/remove-reaction", { workspace_id: workspaceId, issue_id: issueId, emoji });
}

export async function subscribeIssue(workspaceId: string, issueId: string, userId: string): Promise<IssueSubscriber> {
  return getApiClient().call<IssueSubscriber>("/rpc/issue/subscribe", {
    workspace_id: workspaceId,
    issue_id: issueId,
    user_id: userId,
  });
}

export async function unsubscribeIssue(workspaceId: string, issueId: string, userId: string): Promise<void> {
  await getApiClient().call("/rpc/issue/unsubscribe", {
    workspace_id: workspaceId,
    issue_id: issueId,
    user_id: userId,
  });
}
