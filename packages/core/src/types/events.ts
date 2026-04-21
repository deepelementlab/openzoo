export type WSEventType =
  | "issue:created"
  | "issue:updated"
  | "issue:deleted"
  | "comment:created"
  | "comment:updated"
  | "comment:deleted"
  | "reaction:added"
  | "reaction:removed"
  | "issue_reaction:added"
  | "issue_reaction:removed"
  | "agent:created"
  | "agent:archived"
  | "agent:restored"
  | "agent:status"
  | "task:dispatch"
  | "task:progress"
  | "task:completed"
  | "task:failed"
  | "task:message"
  | "task:cancelled"
  | "inbox:new"
  | "inbox:read"
  | "inbox:archived"
  | "workspace:created"
  | "workspace:updated"
  | "workspace:deleted"
  | "member:added"
  | "member:updated"
  | "member:removed"
  | "member:online"
  | "member:offline"
  | "subscriber:added"
  | "subscriber:removed"
  | "activity:created"
  | "skill:created"
  | "skill:updated"
  | "skill:deleted"
  | "chat:message"
  | "chat:done"
  | "project:created"
  | "project:updated"
  | "project:deleted"
  | "pin:created"
  | "pin:deleted"
  | "daemon:heartbeat"
  | "daemon:register"
  | "runtime:registered";

export interface WSEvent<T = unknown> {
  type: WSEventType;
  workspace_id: string;
  actor_id?: string;
  actor_type?: string;
  payload: T;
}

export interface IssuePayload {
  id: string;
  workspace_id: string;
  title: string;
  status: string;
  priority: string;
  identifier: string;
  assignee_id?: string;
  project_id?: string;
  [key: string]: unknown;
}

export interface CommentPayload {
  id: string;
  issue_id: string;
  content: string;
  author_id: string;
  author_type: string;
  [key: string]: unknown;
}

export interface AgentPayload {
  id: string;
  workspace_id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

export interface TaskPayload {
  id: string;
  agent_id: string;
  issue_id: string;
  status: string;
  [key: string]: unknown;
}

export interface InboxPayload {
  id: string;
  type: string;
  title: string;
  [key: string]: unknown;
}

export interface MemberPayload {
  id: string;
  user_id: string;
  workspace_id: string;
  role: string;
  [key: string]: unknown;
}

export interface WorkspacePayload {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ProjectPayload {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

export interface ReactionPayload {
  id: string;
  comment_id?: string;
  issue_id?: string;
  emoji: string;
  actor_id: string;
  [key: string]: unknown;
}

export interface SubscriberPayload {
  issue_id: string;
  user_id: string;
  [key: string]: unknown;
}

export interface TaskMessagePayload {
  task_id: string;
  seq: number;
  type: string;
  content: string;
  [key: string]: unknown;
}

export interface ActivityPayload {
  id: string;
  issue_id: string;
  action: string;
  entity_type: string;
  [key: string]: unknown;
}

export type EventPayloadMap = {
  "issue:created": IssuePayload;
  "issue:updated": IssuePayload;
  "issue:deleted": { issue_id: string };
  "comment:created": CommentPayload;
  "comment:updated": CommentPayload;
  "comment:deleted": { comment_id: string; issue_id: string };
  "reaction:added": ReactionPayload;
  "reaction:removed": ReactionPayload;
  "issue_reaction:added": ReactionPayload;
  "issue_reaction:removed": ReactionPayload;
  "agent:created": AgentPayload;
  "agent:archived": AgentPayload;
  "agent:restored": AgentPayload;
  "agent:status": AgentPayload;
  "task:dispatch": TaskPayload;
  "task:progress": TaskPayload;
  "task:completed": TaskPayload;
  "task:failed": TaskPayload;
  "task:message": TaskMessagePayload;
  "task:cancelled": TaskPayload;
  "inbox:new": InboxPayload;
  "inbox:read": { ids: string[] };
  "inbox:archived": { ids: string[] };
  "workspace:created": WorkspacePayload;
  "workspace:updated": WorkspacePayload;
  "workspace:deleted": { workspace_id: string };
  "member:added": MemberPayload;
  "member:updated": MemberPayload;
  "member:removed": MemberPayload;
  "member:online": { user_id: string };
  "member:offline": { user_id: string };
  "subscriber:added": SubscriberPayload;
  "subscriber:removed": SubscriberPayload;
  "activity:created": ActivityPayload;
  "skill:created": { id: string; name: string };
  "skill:updated": { id: string; name: string };
  "skill:deleted": { id: string };
  "chat:message": { session_id: string; content: string };
  "chat:done": { session_id: string };
  "project:created": ProjectPayload;
  "project:updated": ProjectPayload;
  "project:deleted": { project_id: string };
  "pin:created": { id: string; entity_type: string; entity_id: string };
  "pin:deleted": { id: string };
  "daemon:heartbeat": { daemon_id: string };
  "daemon:register": { daemon_id: string; name: string };
  "runtime:registered": { id: string; name: string };
};

export type TypedWSEvent<T extends WSEventType = WSEventType> = WSEvent<
  T extends keyof EventPayloadMap ? EventPayloadMap[T] : unknown
>;
