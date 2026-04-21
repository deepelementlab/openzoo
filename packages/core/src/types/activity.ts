export interface AssigneeFrequencyEntry {
  assignee_type: string;
  assignee_id: string;
  frequency: number;
}

export interface TimelineEntry {
  id: string;
  type: "comment" | "activity" | "status_change" | "progress_update" | "system";
  created_at: string;
  content?: string;
  author_type?: string;
  author_id?: string;
  reactions?: import("./comment").Reaction[];
  attachments?: import("./attachment").Attachment[];
  parent_id?: string;
  payload?: Record<string, unknown>;
}
