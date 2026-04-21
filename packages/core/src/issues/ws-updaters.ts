import type { Issue } from "../types";
import { getQueryData, setQueryData, invalidateQuery } from "../query-client";
import { issueKeys } from "./queries";

export function onIssueCreated(workspaceId: string, _issue: Issue) {
  invalidateQuery([...issueKeys.all(workspaceId)]);
}

export function onIssueUpdated(workspaceId: string, issue: Issue) {
  const detailKey = [...issueKeys.detail(workspaceId, issue.id)];
  const old = getQueryData<Issue>(detailKey);
  if (old) setQueryData(detailKey, { ...old, ...issue });
  invalidateQuery([...issueKeys.all(workspaceId)]);
}

export function onIssueDeleted(workspaceId: string, issueId: string) {
  invalidateQuery([...issueKeys.detail(workspaceId, issueId)]);
  invalidateQuery([...issueKeys.all(workspaceId)]);
}
