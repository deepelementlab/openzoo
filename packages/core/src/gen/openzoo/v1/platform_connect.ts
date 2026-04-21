// Generated-client shape placeholder for OpenZoo RPC contracts.
// Real generated files are produced by: pnpm gen:proto

import { getApiClient } from "../../../api/connect-client";

export type ListIssuesRequest = { workspace_id: string; limit?: number; offset?: number };
export type ListIssuesResponse = { issues: Array<Record<string, unknown>>; total: number };

export const IssueService = {
  async listIssues(req: ListIssuesRequest): Promise<ListIssuesResponse> {
    return getApiClient().call("/rpc/issue/list", req);
  },
};

export type ListWorkspacesResponse = { workspaces: Array<Record<string, unknown>> };
export const WorkspaceService = {
  async listWorkspaces(): Promise<ListWorkspacesResponse> {
    return getApiClient().call("/rpc/workspace/list", {});
  },
};
