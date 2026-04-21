import { getApiClient } from "../api/connect-client";
import type { Comment, Reaction, Attachment, TimelineEntry } from "../types";

export async function listComments(workspaceId: string, issueId: string, limit = 50, offset = 0): Promise<Comment[]> {
  const res = await getApiClient().call<{ comments: Comment[] }>("/rpc/comment/list", {
    workspace_id: workspaceId, issue_id: issueId, limit, offset,
  });
  return res.comments ?? [];
}

export async function createComment(data: {
  workspace_id: string;
  issue_id: string;
  content: string;
  parent_id?: string;
  attachment_ids?: string[];
}): Promise<Comment> {
  return getApiClient().call<Comment>("/rpc/comment/create", data);
}

export async function updateComment(workspaceId: string, commentId: string, content: string): Promise<Comment> {
  return getApiClient().call<Comment>("/rpc/comment/update", { workspace_id: workspaceId, comment_id: commentId, content });
}

export async function deleteComment(workspaceId: string, commentId: string): Promise<void> {
  await getApiClient().call("/rpc/comment/delete", { workspace_id: workspaceId, comment_id: commentId });
}

export async function addReaction(workspaceId: string, commentId: string, emoji: string): Promise<Reaction> {
  return getApiClient().call<Reaction>("/rpc/comment/add-reaction", { workspace_id: workspaceId, comment_id: commentId, emoji });
}

export async function removeReaction(workspaceId: string, commentId: string, emoji: string): Promise<void> {
  await getApiClient().call("/rpc/comment/remove-reaction", { workspace_id: workspaceId, comment_id: commentId, emoji });
}

export async function listTimeline(workspaceId: string, issueId: string, limit = 50, offset = 0): Promise<TimelineEntry[]> {
  const res = await getApiClient().call<{ entries: TimelineEntry[] }>("/rpc/comment/timeline", {
    workspace_id: workspaceId, issue_id: issueId, limit, offset,
  });
  return res.entries ?? [];
}

export async function uploadAttachment(
  file: File,
  opts: { workspace_id: string; issue_id: string; comment_id?: string },
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspace_id", opts.workspace_id);
  formData.append("issue_id", opts.issue_id);
  if (opts.comment_id) formData.append("comment_id", opts.comment_id);

  const baseUrl = getApiClient().baseUrl;
  const res = await fetch(`${baseUrl}/rpc/comment/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error((errBody as Record<string, string>).error ?? `Upload failed: ${res.status}`);
  }

  return (await res.json()) as Attachment;
}

export async function deleteAttachment(workspaceId: string, attachmentId: string): Promise<void> {
  await getApiClient().call("/rpc/comment/delete-attachment", { workspace_id: workspaceId, attachment_id: attachmentId });
}
