type WSEventType = "issue:created" | "issue:updated" | "issue:deleted" | "comment:created" | "comment:updated" | "comment:deleted" | "reaction:added" | "reaction:removed" | "issue_reaction:added" | "issue_reaction:removed" | "agent:created" | "agent:archived" | "agent:restored" | "agent:status" | "task:dispatch" | "task:progress" | "task:completed" | "task:failed" | "task:message" | "task:cancelled" | "inbox:new" | "inbox:read" | "inbox:archived" | "workspace:created" | "workspace:updated" | "workspace:deleted" | "member:added" | "member:updated" | "member:removed" | "member:online" | "member:offline" | "subscriber:added" | "subscriber:removed" | "activity:created" | "skill:created" | "skill:updated" | "skill:deleted" | "chat:message" | "chat:done" | "project:created" | "project:updated" | "project:deleted" | "pin:created" | "pin:deleted" | "daemon:heartbeat" | "daemon:register" | "runtime:registered";
interface WSEvent<T = unknown> {
    type: WSEventType;
    workspace_id: string;
    actor_id?: string;
    actor_type?: string;
    payload: T;
}
interface IssuePayload {
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
interface CommentPayload {
    id: string;
    issue_id: string;
    content: string;
    author_id: string;
    author_type: string;
    [key: string]: unknown;
}
interface AgentPayload {
    id: string;
    workspace_id: string;
    name: string;
    status: string;
    [key: string]: unknown;
}
interface TaskPayload {
    id: string;
    agent_id: string;
    issue_id: string;
    status: string;
    [key: string]: unknown;
}
interface InboxPayload {
    id: string;
    type: string;
    title: string;
    [key: string]: unknown;
}
interface MemberPayload {
    id: string;
    user_id: string;
    workspace_id: string;
    role: string;
    [key: string]: unknown;
}
interface WorkspacePayload {
    id: string;
    name: string;
    [key: string]: unknown;
}
interface ProjectPayload {
    id: string;
    name: string;
    status: string;
    [key: string]: unknown;
}
interface ReactionPayload {
    id: string;
    comment_id?: string;
    issue_id?: string;
    emoji: string;
    actor_id: string;
    [key: string]: unknown;
}
interface SubscriberPayload {
    issue_id: string;
    user_id: string;
    [key: string]: unknown;
}
interface TaskMessagePayload {
    task_id: string;
    seq: number;
    type: string;
    content: string;
    [key: string]: unknown;
}
interface ActivityPayload {
    id: string;
    issue_id: string;
    action: string;
    entity_type: string;
    [key: string]: unknown;
}
type EventPayloadMap = {
    "issue:created": IssuePayload;
    "issue:updated": IssuePayload;
    "issue:deleted": {
        issue_id: string;
    };
    "comment:created": CommentPayload;
    "comment:updated": CommentPayload;
    "comment:deleted": {
        comment_id: string;
        issue_id: string;
    };
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
    "inbox:read": {
        ids: string[];
    };
    "inbox:archived": {
        ids: string[];
    };
    "workspace:created": WorkspacePayload;
    "workspace:updated": WorkspacePayload;
    "workspace:deleted": {
        workspace_id: string;
    };
    "member:added": MemberPayload;
    "member:updated": MemberPayload;
    "member:removed": MemberPayload;
    "member:online": {
        user_id: string;
    };
    "member:offline": {
        user_id: string;
    };
    "subscriber:added": SubscriberPayload;
    "subscriber:removed": SubscriberPayload;
    "activity:created": ActivityPayload;
    "skill:created": {
        id: string;
        name: string;
    };
    "skill:updated": {
        id: string;
        name: string;
    };
    "skill:deleted": {
        id: string;
    };
    "chat:message": {
        session_id: string;
        content: string;
    };
    "chat:done": {
        session_id: string;
    };
    "project:created": ProjectPayload;
    "project:updated": ProjectPayload;
    "project:deleted": {
        project_id: string;
    };
    "pin:created": {
        id: string;
        entity_type: string;
        entity_id: string;
    };
    "pin:deleted": {
        id: string;
    };
    "daemon:heartbeat": {
        daemon_id: string;
    };
    "daemon:register": {
        daemon_id: string;
        name: string;
    };
    "runtime:registered": {
        id: string;
        name: string;
    };
};
type TypedWSEvent<T extends WSEventType = WSEventType> = WSEvent<T extends keyof EventPayloadMap ? EventPayloadMap[T] : unknown>;

type IssueStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked" | "cancelled";
type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";
type IssueAssigneeType = "member" | "agent";
interface IssueReaction {
    id: string;
    issue_id: string;
    actor_type: string;
    actor_id: string;
    emoji: string;
    created_at: string;
}
interface Issue {
    id: string;
    workspace_id: string;
    number: number;
    identifier: string;
    title: string;
    description: string | null;
    status: IssueStatus;
    priority: IssuePriority;
    assignee_type: IssueAssigneeType | null;
    assignee_id: string | null;
    creator_type: IssueAssigneeType;
    creator_id: string;
    parent_issue_id: string | null;
    project_id: string | null;
    position: number;
    due_date: string | null;
    reactions?: IssueReaction[];
    created_at: string;
    updated_at: string;
}

type AgentStatus = "idle" | "working" | "blocked" | "error" | "offline";
type AgentRuntimeMode = "local" | "cloud";
type AgentVisibility = "workspace" | "private";
type RuntimePingStatus = "pending" | "running" | "completed" | "failed" | "timeout";
type RuntimeUpdateStatus = "pending" | "running" | "completed" | "failed" | "timeout";
interface RuntimeDevice {
    id: string;
    workspace_id: string;
    daemon_id: string | null;
    name: string;
    runtime_mode: AgentRuntimeMode;
    provider: string;
    status: "online" | "offline";
    device_info: string;
    owner_id: string | null;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
}
type AgentRuntime = RuntimeDevice;
interface AgentTask {
    id: string;
    agent_id: string;
    issue_id: string;
    runtime_id: string;
    status: string;
    priority: number;
    dispatched_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    result: unknown;
    error: string | null;
    created_at: string;
}
interface Agent {
    id: string;
    workspace_id: string;
    runtime_id: string;
    name: string;
    description: string;
    instructions: string;
    avatar_url: string | null;
    visibility: AgentVisibility;
    status: AgentStatus;
    max_concurrent_tasks: number;
    owner_id: string | null;
    skills?: Skill[];
    created_at: string;
    updated_at: string;
    archived_at: string | null;
}
interface Skill {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    content: string;
    config: Record<string, unknown>;
    files: SkillFile[];
    created_by: string | null;
    created_at: string;
    updated_at: string;
}
interface SkillFile {
    id: string;
    skill_id: string;
    path: string;
    content: string;
    created_at: string;
    updated_at: string;
}
interface CreateAgentRequest {
    name: string;
    description?: string;
    instructions?: string;
    runtime_id: string;
    visibility?: AgentVisibility;
    max_concurrent_tasks?: number;
}
interface UpdateAgentRequest {
    name?: string;
    description?: string;
    instructions?: string;
    visibility?: AgentVisibility;
    max_concurrent_tasks?: number;
}
interface CreateSkillRequest {
    name: string;
    description?: string;
    content?: string;
}
interface UpdateSkillRequest {
    name?: string;
    description?: string;
    content?: string;
}
interface SetAgentSkillsRequest {
    skill_ids: string[];
}
interface RuntimePing {
    id: string;
    runtime_id: string;
    status: RuntimePingStatus;
    output: string | null;
    error: string | null;
    duration_ms: number | null;
}
interface IssueUsageSummary {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
    task_count: number;
}
interface RuntimeUsage {
    runtime_id: string;
    date: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
}
interface RuntimeHourlyActivity {
    hour: string;
    count: number;
}
interface RuntimeUpdate {
    id: string;
    runtime_id: string;
    target_version: string;
    status: RuntimeUpdateStatus;
    output: string | null;
    error: string | null;
}

interface ChatSession {
    id: string;
    workspace_id: string;
    agent_id: string;
    creator_id: string;
    title: string;
    status: "active" | "archived";
    session_id: string | null;
    work_dir: string | null;
    created_at: string;
    updated_at: string;
}
interface ChatMessage {
    id: string;
    chat_session_id: string;
    role: "user" | "assistant";
    content: string;
    task_id: string | null;
    created_at: string;
}
interface SendChatMessageResponse {
    message_id: string;
    task_id: string;
}

type InboxSeverity = "action_required" | "attention" | "info";
type InboxItemType = "issue_assigned" | "issue_unassigned" | "new_comment" | "mentioned" | "task_completed" | "task_failed" | "agent_blocked" | "reaction_added" | "status_changed" | "priority_changed" | "due_date_changed" | "subscriber_added" | "project_added";
interface InboxItem {
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

interface Attachment {
    id: string;
    workspace_id: string;
    issue_id: string | null;
    comment_id: string | null;
    uploader_type: string;
    uploader_id: string;
    filename: string;
    url: string;
    download_url: string;
    content_type: string;
    size_bytes: number;
    created_at: string;
}

type CommentType = "comment" | "status_change" | "progress_update" | "system";
type CommentAuthorType = "member" | "agent";
interface Reaction {
    id: string;
    comment_id: string;
    actor_type: string;
    actor_id: string;
    emoji: string;
    created_at: string;
}
interface Comment {
    id: string;
    issue_id: string;
    author_type: CommentAuthorType;
    author_id: string;
    content: string;
    type: CommentType;
    parent_id: string | null;
    reactions: Reaction[];
    attachments?: Attachment[];
    created_at: string;
    updated_at: string;
}

type ProjectStatus = "planned" | "in_progress" | "paused" | "completed" | "cancelled";
type ProjectPriority = "urgent" | "high" | "medium" | "low" | "none";
interface Project {
    id: string;
    workspace_id: string;
    title: string;
    description: string | null;
    icon: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    lead_type: string | null;
    lead_id: string | null;
    created_at: string;
    updated_at: string;
    issue_count: number;
    done_count: number;
}
interface CreateProjectRequest {
    title: string;
    description?: string;
    icon?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    lead_type?: string;
    lead_id?: string;
}
interface UpdateProjectRequest {
    title?: string;
    description?: string;
    icon?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    lead_type?: string | null;
    lead_id?: string | null;
}
interface ListProjectsResponse {
    projects: Project[];
    total: number;
}

type MemberRole = "owner" | "admin" | "member";
interface WorkspaceRepo {
    url: string;
    description: string;
}
interface Workspace {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    context: string | null;
    settings: Record<string, unknown> | null;
    repos: WorkspaceRepo[];
    issue_prefix: string;
    issue_counter: number;
    created_at: string;
    updated_at: string;
}
interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    role: MemberRole;
    created_at: string;
}
interface User {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}
interface MemberWithUser {
    id: string;
    workspace_id: string;
    user_id: string;
    role: MemberRole;
    created_at: string;
    name: string;
    email: string;
    avatar_url: string | null;
}

type PinnedItemType = "issue" | "project";
interface PinnedItem {
    id: string;
    workspace_id: string;
    user_id: string;
    item_type: PinnedItemType;
    item_id: string;
    position: number;
    created_at: string;
    title: string;
    identifier?: string;
    status?: string;
}
interface CreatePinRequest {
    item_type: PinnedItemType;
    item_id: string;
}
interface ReorderPinsRequest {
    pins: {
        id: string;
        position: number;
    }[];
}

interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

interface IssueSubscriber {
    issue_id: string;
    user_type: "member" | "agent";
    user_id: string;
    reason: "creator" | "assignee" | "commenter" | "mentioned" | "manual";
    created_at: string;
}

interface AssigneeFrequencyEntry {
    assignee_type: string;
    assignee_id: string;
    frequency: number;
}
interface TimelineEntry {
    id: string;
    type: "comment" | "activity" | "status_change" | "progress_update" | "system";
    created_at: string;
    content?: string;
    author_type?: string;
    author_id?: string;
    reactions?: Reaction[];
    attachments?: Attachment[];
    parent_id?: string;
    payload?: Record<string, unknown>;
}

interface CreateIssueRequest {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_type?: string;
    assignee_id?: string;
    parent_issue_id?: string;
    project_id?: string;
    due_date?: string;
}
interface UpdateIssueRequest {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_type?: string | null;
    assignee_id?: string | null;
    project_id?: string | null;
    due_date?: string | null;
    position?: number;
}
interface ListIssuesParams {
    status?: string[];
    priority?: string[];
    assignee_type?: string;
    assignee_id?: string[];
    creator_id?: string[];
    project_id?: string[];
    search?: string;
    parent_issue_id?: string;
    limit?: number;
    offset?: number;
}
interface ListIssuesResponse {
    issues: Issue[];
    total: number;
    doneTotal: number;
}
interface SearchIssueResult {
    id: string;
    title: string;
    identifier: string;
    status: string;
    priority: string;
    match_source: string;
    matched_snippet: string;
}
interface SearchIssuesResponse {
    issues: SearchIssueResult[];
}
interface SearchProjectResult {
    id: string;
    title: string;
    status: string;
    match_source: string;
    matched_snippet: string;
}
interface SearchProjectsResponse {
    projects: SearchProjectResult[];
}
interface UpdateMeRequest {
    name?: string;
    avatar_url?: string;
}
interface CreateMemberRequest {
    email: string;
    role?: string;
}
interface UpdateMemberRequest {
    role: string;
}
interface PersonalAccessToken {
    id: string;
    name: string;
    prefix: string;
    last_used_at: string | null;
    created_at: string;
}
interface CreatePersonalAccessTokenRequest {
    name: string;
}
interface CreatePersonalAccessTokenResponse {
    id: string;
    token: string;
}
interface PaginationParams {
    limit?: number;
    offset?: number;
}

type TaskStatus = "queued" | "dispatched" | "running" | "completed" | "failed" | "cancelled";
interface Task {
    id: string;
    agent_id: string;
    runtime_id: string;
    issue_id: string;
    status: TaskStatus;
    priority: number;
    dispatched_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    result: unknown;
    error: string | null;
    created_at: string;
}
type TaskMessageType = "text" | "thinking" | "tool_use" | "tool_result" | "error";
interface TaskMessage {
    id: string;
    task_id: string;
    issue_id: string;
    seq: number;
    type: TaskMessageType;
    tool?: string;
    content?: string;
    input?: Record<string, unknown>;
    output?: string;
}
interface WSMessage<T = unknown> {
    type: WSEventType;
    payload: T;
    actor_id?: string;
}

export type { ActivityPayload, Agent, AgentPayload, AgentRuntime, AgentRuntimeMode, AgentStatus, AgentTask, AgentVisibility, AssigneeFrequencyEntry, Attachment, ChatMessage, ChatSession, Comment, CommentAuthorType, CommentPayload, CommentType, CreateAgentRequest, CreateIssueRequest, CreateMemberRequest, CreatePersonalAccessTokenRequest, CreatePersonalAccessTokenResponse, CreatePinRequest, CreateProjectRequest, CreateSkillRequest, EventPayloadMap, InboxItem, InboxItemType, InboxPayload, InboxSeverity, Issue, IssueAssigneeType, IssuePayload, IssuePriority, IssueReaction, IssueStatus, IssueSubscriber, IssueUsageSummary, ListIssuesParams, ListIssuesResponse, ListProjectsResponse, Member, MemberPayload, MemberRole, MemberWithUser, PaginationParams, PersonalAccessToken, PinnedItem, PinnedItemType, Project, ProjectPayload, ProjectPriority, ProjectStatus, Reaction, ReactionPayload, ReorderPinsRequest, RuntimeDevice, RuntimeHourlyActivity, RuntimePing, RuntimePingStatus, RuntimeUpdate, RuntimeUpdateStatus, RuntimeUsage, SearchIssueResult, SearchIssuesResponse, SearchProjectResult, SearchProjectsResponse, SendChatMessageResponse, SetAgentSkillsRequest, Skill, SkillFile, StorageAdapter, SubscriberPayload, Task, TaskMessage, TaskMessagePayload, TaskMessageType, TaskPayload, TaskStatus, TimelineEntry, TypedWSEvent, UpdateAgentRequest, UpdateIssueRequest, UpdateMeRequest, UpdateMemberRequest, UpdateProjectRequest, UpdateSkillRequest, User, WSEvent, WSEventType, WSMessage, Workspace, WorkspacePayload, WorkspaceRepo };
