const TYPE_LABELS: Record<string, string> = {
  issue_assigned: "assigned you",
  issue_unassigned: "unassigned you from",
  new_comment: "commented on",
  mentioned: "mentioned you in",
  task_completed: "completed task on",
  task_failed: "task failed on",
  agent_blocked: "is blocked on",
  reaction_added: "reacted to",
  status_changed: "changed status of",
  priority_changed: "changed priority of",
  due_date_changed: "changed due date of",
  subscriber_added: "subscribed to",
  project_added: "added to project",
};

interface InboxDetailLabelProps {
  type: string;
  title?: string;
}

export function InboxDetailLabel({ type, title }: InboxDetailLabelProps) {
  const label = TYPE_LABELS[type] ?? type;
  return (
    <span className="text-sm text-muted-foreground">
      {label}
      {title && (
        <>
          {" "}
          <span className="font-medium text-foreground">{title}</span>
        </>
      )}
    </span>
  );
}

export { TYPE_LABELS };
