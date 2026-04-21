export type InboxSeverity = "action_required" | "attention" | "info";
export type InboxItemType =
  | "issue_assigned"
  | "issue_unassigned"
  | "new_comment"
  | "mentioned"
  | "task_completed"
  | "task_failed"
  | "agent_blocked"
  | "reaction_added"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "subscriber_added"
  | "project_added";

export interface InboxItem {
  id: string;
  workspace_id: string;
  recipient_type: string;
  recipient_id: string;
  actor_type: string | null;
  actor_id: string | null;
  type: InboxItemType | string;
  severity: InboxSeverity;
  issue_id: string | null;
  title: string;
  body: string | null;
  issue_status: string | null;
  read: boolean;
  archived: boolean;
  created_at: string;
  details: Record<string, string> | null;
}
