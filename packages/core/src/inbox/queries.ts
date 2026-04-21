import { getApiClient } from "../api/connect-client";
import type { InboxItem } from "../types";

export const inboxKeys = {
  all: () => ["inbox"] as const,
  list: () => ["inbox", "list"] as const,
};

export async function listInbox(params: {
  workspace_id: string;
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: InboxItem[]; total: number; unread_count: number }> {
  return getApiClient().call("/rpc/inbox/list", params);
}

export async function markInboxRead(workspaceId: string, itemIds: string[]): Promise<void> {
  await getApiClient().call("/rpc/inbox/mark-read", { workspace_id: workspaceId, item_ids: itemIds });
}

export async function markInboxArchived(workspaceId: string, itemIds: string[]): Promise<void> {
  await getApiClient().call("/rpc/inbox/mark-archived", { workspace_id: workspaceId, item_ids: itemIds });
}

export async function markAllInboxRead(workspaceId: string): Promise<void> {
  await getApiClient().call("/rpc/inbox/mark-all-read", { workspace_id: workspaceId });
}
