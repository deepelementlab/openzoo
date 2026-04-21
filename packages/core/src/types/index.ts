import type { WSEventType } from "./events";

export type { IssueStatus, IssuePriority, IssueAssigneeType, IssueReaction, Issue } from "./issue";

export type {
  AgentStatus, AgentRuntimeMode, AgentVisibility, RuntimePingStatus, RuntimeUpdateStatus,
  RuntimeDevice, AgentRuntime, AgentTask, Agent, Skill, SkillFile,
  CreateAgentRequest, UpdateAgentRequest, CreateSkillRequest, UpdateSkillRequest,
  SetAgentSkillsRequest, RuntimePing, IssueUsageSummary, RuntimeUsage,
  RuntimeHourlyActivity, RuntimeUpdate,
} from "./agent";

export type { ChatSession, ChatMessage, SendChatMessageResponse } from "./chat";

export type { InboxSeverity, InboxItemType, InboxItem } from "./inbox";

export type { CommentType, CommentAuthorType, Reaction, Comment } from "./comment";

export type {
  ProjectStatus, ProjectPriority, Project, CreateProjectRequest,
  UpdateProjectRequest, ListProjectsResponse,
} from "./project";

export type {
  MemberRole, WorkspaceRepo, Workspace, Member, User, MemberWithUser,
} from "./workspace";

export type { PinnedItemType, PinnedItem, CreatePinRequest, ReorderPinsRequest } from "./pin";

export type { Attachment } from "./attachment";
export type { StorageAdapter } from "./storage";
export type { IssueSubscriber } from "./subscriber";
export type { AssigneeFrequencyEntry, TimelineEntry } from "./activity";

export type {
  CreateIssueRequest, UpdateIssueRequest, ListIssuesParams, ListIssuesResponse,
  SearchIssueResult, SearchIssuesResponse, SearchProjectResult, SearchProjectsResponse,
  UpdateMeRequest, CreateMemberRequest, UpdateMemberRequest,
  PersonalAccessToken, CreatePersonalAccessTokenRequest,
  CreatePersonalAccessTokenResponse, PaginationParams,
} from "./api";

export type {
  WSEventType, WSEvent, TypedWSEvent, EventPayloadMap,
  IssuePayload, CommentPayload, AgentPayload, TaskPayload, InboxPayload,
  MemberPayload, WorkspacePayload, ProjectPayload, ReactionPayload,
  SubscriberPayload, TaskMessagePayload, ActivityPayload,
} from "./events";

export type TaskStatus = "queued" | "dispatched" | "running" | "completed" | "failed" | "cancelled";

export interface Task {
  id: string; agent_id: string; runtime_id: string; issue_id: string;
  status: TaskStatus; priority: number;
  dispatched_at: string | null; started_at: string | null; completed_at: string | null;
  result: unknown; error: string | null; created_at: string;
}

export type TaskMessageType = "text" | "thinking" | "tool_use" | "tool_result" | "error";

export interface TaskMessage {
  id: string; task_id: string; issue_id: string; seq: number;
  type: TaskMessageType; tool?: string; content?: string;
  input?: Record<string, unknown>; output?: string;
}

export interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  actor_id?: string;
}
