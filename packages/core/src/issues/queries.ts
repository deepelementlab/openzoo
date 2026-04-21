import { getApiClient } from "../api/connect-client";
import type { Issue, IssueSubscriber } from "../types";

export interface ListIssuesParams {
  workspace_id: string;
  limit?: number;
  offset?: number;
  status?: string;
  priority?: string;
  assignee_id?: string;
  open_only?: boolean;
}

export const issueKeys = {
  all: (wsId: string) => ["issues", wsId] as const,
  list: (wsId: string, params?: Record<string, unknown>) => ["issues", wsId, params] as const,
  detail: (wsId: string, id: string) => ["issue", wsId, id] as const,
  subscribers: (wsId: string, id: string) => ["issue-subscribers", wsId, id] as const,
  reactions: (wsId: string, id: string) => ["issue-reactions", wsId, id] as const,
  timeline: (wsId: string, id: string) => ["timeline", wsId, id] as const,
  comments: (wsId: string, id: string) => ["comments", wsId, id] as const,
};

export async function listIssues(params: ListIssuesParams): Promise<{ issues: Issue[]; total: number }> {
  return getApiClient().call<{ issues: Issue[]; total: number }>("/rpc/issue/list", { ...params });
}

export async function getIssue(workspaceId: string, issueId: string): Promise<Issue> {
  return getApiClient().call<Issue>("/rpc/issue/get", { workspace_id: workspaceId, issue_id: issueId });
}

export async function searchIssues(workspaceId: string, query: string, limit = 20): Promise<{ results: Issue[]; total: number }> {
  return getApiClient().call("/rpc/search/issues", { workspace_id: workspaceId, query, limit });
}

export async function listIssueSubscribers(workspaceId: string, issueId: string): Promise<IssueSubscriber[]> {
  const res = await getApiClient().call<{ subscribers: IssueSubscriber[] }>("/rpc/issue/subscribers", { workspace_id: workspaceId, issue_id: issueId });
  return res.subscribers ?? [];
}
