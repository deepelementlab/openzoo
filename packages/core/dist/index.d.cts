import { User, Workspace, MemberWithUser, Issue, IssueSubscriber, IssueReaction, IssueStatus, IssuePriority, Agent, Skill, RuntimeDevice, Task, TaskMessage, ChatSession, ChatMessage, Reaction, Comment, TimelineEntry, Attachment, InboxItem, PinnedItem, Project, WSEventType, TypedWSEvent } from './types/index.cjs';
export { ActivityPayload, AgentPayload, AgentRuntime, AgentRuntimeMode, AgentStatus, AgentTask, AgentVisibility, AssigneeFrequencyEntry, CommentAuthorType, CommentPayload, CommentType, CreateAgentRequest, CreateIssueRequest, CreateMemberRequest, CreatePersonalAccessTokenRequest, CreatePersonalAccessTokenResponse, CreatePinRequest, CreateProjectRequest, CreateSkillRequest, EventPayloadMap, InboxItemType, InboxPayload, InboxSeverity, IssueAssigneeType, IssuePayload, IssueUsageSummary, ListIssuesParams, ListIssuesResponse, ListProjectsResponse, Member, MemberPayload, MemberRole, PaginationParams, PersonalAccessToken, PinnedItemType, ProjectPayload, ProjectPriority, ProjectStatus, ReactionPayload, ReorderPinsRequest, RuntimeHourlyActivity, RuntimePing, RuntimePingStatus, RuntimeUpdate, RuntimeUpdateStatus, RuntimeUsage, SearchIssueResult, SearchIssuesResponse, SearchProjectResult, SearchProjectsResponse, SendChatMessageResponse, SetAgentSkillsRequest, SkillFile, StorageAdapter, SubscriberPayload, TaskMessagePayload, TaskMessageType, TaskPayload, TaskStatus, UpdateAgentRequest, UpdateIssueRequest, UpdateMeRequest, UpdateMemberRequest, UpdateProjectRequest, UpdateSkillRequest, WSEvent, WSMessage, WorkspacePayload, WorkspaceRepo } from './types/index.cjs';
import * as _tanstack_react_query from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import * as zustand from 'zustand';
import React, { ReactNode } from 'react';

interface ApiClientConfig {
    baseUrl?: string;
    getToken?: () => string | null;
    getWorkspaceId?: () => string | null;
    onUnauthorized?: () => void;
}
declare class ApiClient {
    private config;
    constructor(config?: ApiClientConfig);
    get baseUrl(): string;
    call<TResp = unknown>(route: string, body?: Record<string, unknown>): Promise<TResp>;
}
declare function getApiClient(): ApiClient;
declare function configureApiClient(config: ApiClientConfig): void;
declare function setToken(token: string | null): void;
declare function getToken(): string | null;
declare function setWorkspaceId(id: string | null): void;
declare function getWorkspaceId(): string | null;
declare function onUnauthorized(cb: () => void): void;

declare const queryClient: QueryClient;
declare function invalidateQuery(queryKey: string[], workspaceId?: string): void;
declare function setQueryData<T>(queryKey: string[], data: T | ((old: T | undefined) => T)): void;
declare function getQueryData<T>(queryKey: string[]): T | undefined;

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    loadFromStorage: () => void;
    sendCode: (email: string) => Promise<boolean>;
    verifyCode: (email: string, code: string) => Promise<void>;
    logout: () => void;
}
declare const useAuthStore: zustand.UseBoundStore<zustand.StoreApi<AuthState>>;

declare function sendVerificationCode(email: string): Promise<boolean>;
declare function verifyCode(email: string, code: string): Promise<{
    token: string;
    user: User;
}>;
declare function getCurrentUser(): Promise<User>;
declare function updateCurrentUser(data: {
    name?: string;
    avatar_url?: string;
}): Promise<User>;

interface WorkspaceState {
    currentWorkspace: Workspace | null;
    workspaces: Workspace[];
    isLoading: boolean;
    setCurrentWorkspace: (ws: Workspace | null) => void;
    setWorkspaces: (ws: Workspace[]) => void;
    loadWorkspaces: () => Promise<void>;
}
declare const useWorkspaceStore: zustand.UseBoundStore<zustand.StoreApi<WorkspaceState>>;

declare function listWorkspaces(): Promise<Workspace[]>;
declare function getWorkspace(workspaceId: string): Promise<Workspace & {
    repos?: unknown[];
}>;
declare function createWorkspace(data: {
    name: string;
    description?: string;
    issue_prefix?: string;
}): Promise<Workspace>;
declare function updateWorkspace(workspaceId: string, data: Record<string, unknown>): Promise<Workspace>;
declare function deleteWorkspace(workspaceId: string): Promise<void>;
declare function listMembers(workspaceId: string): Promise<MemberWithUser[]>;
declare function createMember(workspaceId: string, email: string, role?: string): Promise<MemberWithUser>;
declare function updateMember(workspaceId: string, memberId: string, role: string): Promise<MemberWithUser>;
declare function deleteMember(workspaceId: string, memberId: string): Promise<void>;

declare function useWorkspaces(): _tanstack_react_query.UseQueryResult<Workspace[], Error>;
declare function useWorkspace(workspaceId: string): _tanstack_react_query.UseQueryResult<Workspace & {
    repos?: unknown[];
}, Error>;
declare function useCreateWorkspace(): _tanstack_react_query.UseMutationResult<Workspace, Error, {
    name: string;
    description?: string;
    issue_prefix?: string;
}, unknown>;
declare function useUpdateWorkspace(): _tanstack_react_query.UseMutationResult<Workspace, Error, {
    workspaceId: string;
    data: Record<string, unknown>;
}, unknown>;
declare function useDeleteWorkspace(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;
declare function useMembers(workspaceId: string): _tanstack_react_query.UseQueryResult<MemberWithUser[], Error>;
declare function useCreateMember(): _tanstack_react_query.UseMutationResult<MemberWithUser, Error, {
    workspaceId: string;
    email: string;
    role?: string;
}, unknown>;
declare function useUpdateMember(): _tanstack_react_query.UseMutationResult<MemberWithUser, Error, {
    workspaceId: string;
    memberId: string;
    role: string;
}, unknown>;
declare function useDeleteMember(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    memberId: string;
}, unknown>;

interface ListIssuesParams {
    workspace_id: string;
    limit?: number;
    offset?: number;
    status?: string;
    priority?: string;
    assignee_id?: string;
    open_only?: boolean;
}
declare const issueKeys: {
    all: (wsId: string) => readonly ["issues", string];
    list: (wsId: string, params?: Record<string, unknown>) => readonly ["issues", string, Record<string, unknown> | undefined];
    detail: (wsId: string, id: string) => readonly ["issue", string, string];
    subscribers: (wsId: string, id: string) => readonly ["issue-subscribers", string, string];
    reactions: (wsId: string, id: string) => readonly ["issue-reactions", string, string];
    timeline: (wsId: string, id: string) => readonly ["timeline", string, string];
    comments: (wsId: string, id: string) => readonly ["comments", string, string];
};
declare function listIssues(params: ListIssuesParams): Promise<{
    issues: Issue[];
    total: number;
}>;
declare function getIssue(workspaceId: string, issueId: string): Promise<Issue>;
declare function searchIssues(workspaceId: string, query: string, limit?: number): Promise<{
    results: Issue[];
    total: number;
}>;
declare function listIssueSubscribers(workspaceId: string, issueId: string): Promise<IssueSubscriber[]>;

declare function createIssue(data: {
    workspace_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_type?: string;
    assignee_id?: string;
    project_id?: string;
    due_date?: string;
}): Promise<Issue>;
declare function updateIssue(workspaceId: string, issueId: string, data: Record<string, unknown>): Promise<Issue>;
declare function deleteIssue(workspaceId: string, issueId: string): Promise<void>;
declare function batchUpdateIssues(workspaceId: string, issueIds: string[], data: Record<string, unknown>): Promise<{
    issues: Issue[];
    updated: number;
}>;
declare function addIssueReaction(workspaceId: string, issueId: string, emoji: string): Promise<IssueReaction>;
declare function removeIssueReaction(workspaceId: string, issueId: string, emoji: string): Promise<void>;
declare function subscribeIssue(workspaceId: string, issueId: string, userId: string): Promise<IssueSubscriber>;
declare function unsubscribeIssue(workspaceId: string, issueId: string, userId: string): Promise<void>;

interface IssueViewFilters {
    status: IssueStatus | null;
    priority: IssuePriority | null;
    assignee_id: string | null;
    project_id: string | null;
    search: string;
    view_mode: "list" | "board";
}
interface IssueViewState {
    filters: IssueViewFilters;
    selected_issue_id: string | null;
    setFilters: (f: Partial<IssueViewFilters>) => void;
    setSelectedIssueId: (id: string | null) => void;
    resetFilters: () => void;
}
declare const useIssueViewStore: zustand.UseBoundStore<zustand.StoreApi<IssueViewState>>;

interface IssueListData {
    issues: Issue[];
    total: number;
}
declare function useIssues(workspaceId: string, params?: {
    limit?: number;
    offset?: number;
}): _tanstack_react_query.UseQueryResult<{
    issues: Issue[];
    total: number;
}, Error>;
declare function useIssue(workspaceId: string, issueId: string): _tanstack_react_query.UseQueryResult<Issue, Error>;
declare function useCreateIssue(): _tanstack_react_query.UseMutationResult<Issue, Error, {
    workspace_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignee_type?: string;
    assignee_id?: string;
    project_id?: string;
    due_date?: string;
}, unknown>;
declare function useUpdateIssue(): _tanstack_react_query.UseMutationResult<Issue, Error, {
    workspaceId: string;
    issueId: string;
    data: Record<string, unknown>;
}, {
    prevList?: IssueListData;
    prevDetail?: Issue;
    parentId?: string | null;
}>;
declare function useDeleteIssue(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    issueId: string;
}, {
    prevList?: IssueListData;
    parentIssueId?: string | null;
}>;
declare function useAddIssueReaction(): _tanstack_react_query.UseMutationResult<IssueReaction, Error, {
    workspaceId: string;
    issueId: string;
    emoji: string;
}, {
    prevDetail?: Issue;
}>;
declare function useRemoveIssueReaction(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    issueId: string;
    emoji: string;
}, {
    prevDetail?: Issue;
}>;
declare function useIssueSubscribers(workspaceId: string, issueId: string): _tanstack_react_query.UseQueryResult<IssueSubscriber[], Error>;
declare function useSubscribeIssue(): _tanstack_react_query.UseMutationResult<IssueSubscriber, Error, {
    workspaceId: string;
    issueId: string;
    userId: string;
}, {
    previous?: IssueSubscriber[];
}>;
declare function useUnsubscribeIssue(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    issueId: string;
    userId: string;
}, {
    previous?: IssueSubscriber[];
}>;

declare function listAgents(workspaceId: string): Promise<Agent[]>;
declare function getAgent(workspaceId: string, agentId: string): Promise<Agent>;
declare function createAgent(data: {
    workspace_id: string;
    name: string;
    description?: string;
    instructions?: string;
    runtime_id?: string;
    visibility?: string;
    max_concurrent_tasks?: number;
}): Promise<Agent>;
declare function updateAgent(workspaceId: string, agentId: string, data: Record<string, unknown>): Promise<Agent>;
declare function archiveAgent(workspaceId: string, agentId: string): Promise<Agent>;
declare function restoreAgent(workspaceId: string, agentId: string): Promise<Agent>;
declare function setAgentSkills(workspaceId: string, agentId: string, skillIds: string[]): Promise<Agent>;
declare function listSkills(workspaceId: string): Promise<Skill[]>;
declare function createSkill(data: {
    workspace_id: string;
    name: string;
    description?: string;
    content?: string;
    files?: {
        path: string;
        content: string;
    }[];
}): Promise<Skill>;
declare function updateSkill(workspaceId: string, skillId: string, data: Record<string, unknown>): Promise<Skill>;
declare function deleteSkill(workspaceId: string, skillId: string): Promise<void>;

declare function useAgents(workspaceId: string): _tanstack_react_query.UseQueryResult<Agent[], Error>;
declare function useAgent(workspaceId: string, agentId: string): _tanstack_react_query.UseQueryResult<Agent, Error>;
declare function useCreateAgent(): _tanstack_react_query.UseMutationResult<Agent, Error, {
    workspace_id: string;
    name: string;
    description?: string;
    instructions?: string;
    runtime_id?: string;
    visibility?: string;
    max_concurrent_tasks?: number;
}, unknown>;
declare function useUpdateAgent(): _tanstack_react_query.UseMutationResult<Agent, Error, {
    workspaceId: string;
    agentId: string;
    data: Record<string, unknown>;
}, any>;
declare function useArchiveAgent(): _tanstack_react_query.UseMutationResult<Agent, Error, {
    workspaceId: string;
    agentId: string;
}, unknown>;
declare function useRestoreAgent(): _tanstack_react_query.UseMutationResult<Agent, Error, {
    workspaceId: string;
    agentId: string;
}, unknown>;
declare function useSkills(workspaceId: string): _tanstack_react_query.UseQueryResult<Skill[], Error>;
declare function useCreateSkill(): _tanstack_react_query.UseMutationResult<Skill, Error, {
    workspace_id: string;
    name: string;
    description?: string;
    content?: string;
    files?: {
        path: string;
        content: string;
    }[];
}, unknown>;
declare function useUpdateSkill(): _tanstack_react_query.UseMutationResult<Skill, Error, {
    workspaceId: string;
    skillId: string;
    data: Record<string, unknown>;
}, unknown>;
declare function useDeleteSkill(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    skillId: string;
}, unknown>;

declare function listRuntimes(workspaceId: string): Promise<RuntimeDevice[]>;
declare function registerRuntime(data: {
    workspace_id: string;
    name: string;
    provider: string;
    runtime_mode?: string;
    device_info?: string;
}): Promise<RuntimeDevice>;
declare function getRuntime(workspaceId: string, runtimeId: string): Promise<RuntimeDevice>;
declare function pingRuntime(workspaceId: string, runtimeId: string): Promise<unknown>;
declare function listRuntimeUsage(workspaceId: string, runtimeId: string, days?: number): Promise<unknown[]>;

declare function updateRuntime(data: {
    workspace_id: string;
    runtime_id: string;
    name?: string;
    status?: string;
}): Promise<RuntimeDevice>;
declare function deleteRuntime(workspaceId: string, runtimeId: string): Promise<void>;

declare function useRuntimes(workspaceId: string): _tanstack_react_query.UseQueryResult<RuntimeDevice[], Error>;
declare function useRuntime(workspaceId: string, runtimeId: string): _tanstack_react_query.UseQueryResult<RuntimeDevice, Error>;
declare function useRegisterRuntime(): _tanstack_react_query.UseMutationResult<RuntimeDevice, Error, {
    workspace_id: string;
    name: string;
    provider: string;
    runtime_mode?: string;
    device_info?: string;
}, unknown>;
declare function useUpdateRuntime(): _tanstack_react_query.UseMutationResult<RuntimeDevice, Error, {
    workspace_id: string;
    runtime_id: string;
    name?: string;
    status?: string;
}, unknown>;
declare function useDeleteRuntime(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    runtimeId: string;
}, unknown>;
declare function useRuntimeUsage(workspaceId: string, runtimeId: string, days?: number): _tanstack_react_query.UseQueryResult<unknown[], Error>;
declare function usePingRuntime(): _tanstack_react_query.UseMutationResult<unknown, Error, {
    workspaceId: string;
    runtimeId: string;
}, unknown>;

declare function createTask(data: {
    workspace_id: string;
    issue_id: string;
    runtime_id?: string;
    agent_id?: string;
    prompt?: string;
}): Promise<Task>;
declare function getTask(workspaceId: string, taskId: string): Promise<Task>;
declare function listTasks(params: {
    workspace_id: string;
    issue_id?: string;
    agent_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    tasks: Task[];
    total: number;
}>;
declare function updateTaskStatus(workspaceId: string, taskId: string, status: string, data?: {
    error?: string;
    result_json?: string;
}): Promise<Task>;
declare function cancelTask(workspaceId: string, taskId: string): Promise<Task>;
declare function listTaskMessages(workspaceId: string, taskId: string, limit?: number, offset?: number): Promise<TaskMessage[]>;

declare function listChatSessions(params: {
    workspace_id: string;
    agent_id?: string;
    limit?: number;
    offset?: number;
}): Promise<{
    sessions: ChatSession[];
}>;
declare function getChatSession(workspaceId: string, sessionId: string): Promise<ChatSession>;
declare function createChatSession(data: {
    workspace_id: string;
    agent_id: string;
    title?: string;
}): Promise<ChatSession>;
declare function archiveChatSession(workspaceId: string, sessionId: string): Promise<ChatSession>;
declare function listChatMessages(params: {
    workspace_id: string;
    session_id: string;
    limit?: number;
    offset?: number;
}): Promise<{
    messages: ChatMessage[];
}>;
declare function sendChatMessage(data: {
    workspace_id: string;
    session_id: string;
    content: string;
}): Promise<{
    message_id: string;
    task_id: string;
}>;

declare function useChatSessions(workspaceId: string): _tanstack_react_query.UseQueryResult<{
    sessions: ChatSession[];
}, Error>;
declare function useChatSession(workspaceId: string, sessionId: string): _tanstack_react_query.UseQueryResult<ChatSession, Error>;
declare function useChatMessages(workspaceId: string, sessionId: string): _tanstack_react_query.UseQueryResult<{
    messages: ChatMessage[];
}, Error>;
declare function useCreateChatSession(): _tanstack_react_query.UseMutationResult<ChatSession, Error, {
    workspace_id: string;
    agent_id: string;
    title?: string;
}, unknown>;
declare function useSendChatMessage(): _tanstack_react_query.UseMutationResult<{
    message_id: string;
    task_id: string;
}, Error, {
    workspace_id: string;
    session_id: string;
    content: string;
}, unknown>;

declare function listComments(workspaceId: string, issueId: string, limit?: number, offset?: number): Promise<Comment[]>;
declare function createComment(data: {
    workspace_id: string;
    issue_id: string;
    content: string;
    parent_id?: string;
    attachment_ids?: string[];
}): Promise<Comment>;
declare function updateComment(workspaceId: string, commentId: string, content: string): Promise<Comment>;
declare function deleteComment(workspaceId: string, commentId: string): Promise<void>;
declare function addReaction(workspaceId: string, commentId: string, emoji: string): Promise<Reaction>;
declare function removeReaction(workspaceId: string, commentId: string, emoji: string): Promise<void>;
declare function listTimeline(workspaceId: string, issueId: string, limit?: number, offset?: number): Promise<TimelineEntry[]>;
declare function uploadAttachment(file: File, opts: {
    workspace_id: string;
    issue_id: string;
    comment_id?: string;
}): Promise<Attachment>;
declare function deleteAttachment(workspaceId: string, attachmentId: string): Promise<void>;

declare function useComments(workspaceId: string, issueId: string): _tanstack_react_query.UseQueryResult<Comment[], Error>;
declare function useCreateComment(): _tanstack_react_query.UseMutationResult<Comment, Error, {
    workspace_id: string;
    issue_id: string;
    content: string;
    parent_id?: string;
    attachment_ids?: string[];
}, {
    previous?: Comment[];
    prevTimeline?: TimelineEntry[];
}>;
declare function useUpdateComment(): _tanstack_react_query.UseMutationResult<Comment, Error, {
    workspaceId: string;
    commentId: string;
    content: string;
}, {
    previous?: Comment[];
}>;
declare function useDeleteComment(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    commentId: string;
}, {
    previous?: Comment[];
}>;
declare function useAddReaction(): _tanstack_react_query.UseMutationResult<Reaction, Error, {
    workspaceId: string;
    commentId: string;
    emoji: string;
}, {
    previous?: Comment[];
}>;
declare function useRemoveReaction(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    commentId: string;
    emoji: string;
}, {
    previous?: Comment[];
}>;
declare function useTimeline(workspaceId: string, issueId: string): _tanstack_react_query.UseQueryResult<TimelineEntry[], Error>;

declare function listInbox(params: {
    workspace_id: string;
    unread_only?: boolean;
    limit?: number;
    offset?: number;
}): Promise<{
    items: InboxItem[];
    total: number;
    unread_count: number;
}>;
declare function markInboxRead(workspaceId: string, itemIds: string[]): Promise<void>;
declare function markInboxArchived(workspaceId: string, itemIds: string[]): Promise<void>;
declare function markAllInboxRead(workspaceId: string): Promise<void>;

declare function useInbox(workspaceId: string, params?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
}): _tanstack_react_query.UseQueryResult<{
    items: InboxItem[];
    total: number;
    unread_count: number;
}, Error>;
declare function useMarkInboxRead(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    inboxId: string;
}, unknown>;
declare function useMarkInboxArchived(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    inboxId: string;
}, unknown>;
declare function useMarkAllInboxRead(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;

declare function listProjects(params: {
    workspace_id: string;
    limit?: number;
    offset?: number;
}): Promise<{
    projects: Project[];
    total: number;
}>;
declare function getProject(workspaceId: string, projectId: string): Promise<Project>;
declare function createProject(data: {
    workspace_id: string;
    title: string;
    description?: string;
    icon?: string;
    status?: string;
    priority?: string;
    lead_type?: string;
    lead_id?: string;
}): Promise<Project>;
declare function updateProject(workspaceId: string, projectId: string, data: Record<string, unknown>): Promise<Project>;
declare function deleteProject(workspaceId: string, projectId: string): Promise<void>;
declare function searchProjects(workspaceId: string, query: string, limit?: number): Promise<{
    results: Project[];
    total: number;
}>;
declare function listPins(workspaceId: string): Promise<PinnedItem[]>;
declare function createPin(workspaceId: string, itemType: string, itemId: string): Promise<PinnedItem>;
declare function deletePin(workspaceId: string, pinId: string): Promise<void>;
declare function reorderPins(workspaceId: string, items: {
    id: string;
    position: number;
}[]): Promise<void>;

declare function useProjects(workspaceId: string): _tanstack_react_query.UseQueryResult<{
    projects: Project[];
    total: number;
}, Error>;
declare function useProject(workspaceId: string, projectId: string): _tanstack_react_query.UseQueryResult<Project, Error>;
declare function useCreateProject(): _tanstack_react_query.UseMutationResult<Project, Error, {
    workspace_id: string;
    title: string;
    description?: string;
    icon?: string;
    status?: string;
    priority?: string;
    lead_type?: string;
    lead_id?: string;
}, unknown>;
declare function useUpdateProject(): _tanstack_react_query.UseMutationResult<Project, Error, {
    workspaceId: string;
    projectId: string;
    data: Record<string, unknown>;
}, any>;
declare function useDeleteProject(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    projectId: string;
}, any>;

type InternalHandler = (event: {
    type: string;
    [k: string]: unknown;
}) => void;
declare function connectGlobal(workspaceId: string): void;
declare function disconnectGlobal(): void;
declare class OpenZooRealtimeClient {
    private workspaceId;
    private unsub;
    constructor(workspaceId: string);
    subscribe(channel: string, handler: InternalHandler): () => void;
    connect(): void;
    disconnect(): void;
}
type TypedEventHandler<T extends WSEventType = WSEventType> = (event: TypedWSEvent<T>) => void;
declare function useWSEvent<T extends WSEventType>(eventType: T, handler: TypedEventHandler<T>): () => void;

interface RealtimeCallbacks {
    onIssueChanged?: () => void;
    onCommentChanged?: (issueId: string) => void;
    onTaskChanged?: () => void;
    onAgentChanged?: () => void;
    onInboxChanged?: () => void;
    onProjectChanged?: () => void;
    onWorkspaceChanged?: () => void;
    onUnknown?: (type: string) => void;
}
declare function attachRealtimeSync(workspaceId: string, callbacks: RealtimeCallbacks): () => void;

interface Cycle {
    id: string;
    workspace_id: string;
    number: number;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: string;
    auto_create_next: boolean;
    created_at: string;
    updated_at: string;
}

declare function useCycles(workspaceId: string): _tanstack_react_query.UseQueryResult<Cycle[], Error>;
declare function useCycle(workspaceId: string, cycleId: string): _tanstack_react_query.UseQueryResult<Cycle, Error>;
declare function useCreateCycle(): _tanstack_react_query.UseMutationResult<Cycle, Error, {
    workspace_id: string;
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    auto_create_next?: boolean;
}, unknown>;
declare function useUpdateCycle(): _tanstack_react_query.UseMutationResult<Cycle, Error, {
    workspaceId: string;
    cycleId: string;
    data: Record<string, unknown>;
}, unknown>;
declare function useDeleteCycle(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    cycleId: string;
}, unknown>;
declare function useAddIssueToCycle(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    cycleId: string;
    issueId: string;
}, unknown>;
declare function useRemoveIssueFromCycle(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    cycleId: string;
    issueId: string;
}, unknown>;

interface Label {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    color: string;
    created_at: string;
    updated_at: string;
}

declare function useLabels(workspaceId: string): _tanstack_react_query.UseQueryResult<Label[], Error>;
declare function useIssueLabels(workspaceId: string, issueId: string): _tanstack_react_query.UseQueryResult<Label[], Error>;
declare function useCreateLabel(): _tanstack_react_query.UseMutationResult<Label, Error, {
    workspace_id: string;
    name: string;
    description?: string;
    color?: string;
}, unknown>;
declare function useUpdateLabel(): _tanstack_react_query.UseMutationResult<Label, Error, {
    workspaceId: string;
    labelId: string;
    data: Record<string, unknown>;
}, unknown>;
declare function useDeleteLabel(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    labelId: string;
}, unknown>;
declare function useAddLabelToIssue(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    issueId: string;
    labelId: string;
}, unknown>;
declare function useRemoveLabelFromIssue(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    issueId: string;
    labelId: string;
}, unknown>;

interface View {
    id: string;
    workspace_id: string;
    name: string;
    description: string;
    filters: Record<string, unknown>;
    sort_order: Record<string, unknown>;
    is_shared: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

declare function useViews(workspaceId: string): _tanstack_react_query.UseQueryResult<View[], Error>;
declare function useView(workspaceId: string, viewId: string): _tanstack_react_query.UseQueryResult<View, Error>;
declare function useCreateView(): _tanstack_react_query.UseMutationResult<View, Error, {
    workspace_id: string;
    name: string;
    description?: string;
    filters?: Record<string, unknown>;
    sort_order?: Record<string, unknown>;
    is_shared?: boolean;
}, unknown>;
declare function useUpdateView(): _tanstack_react_query.UseMutationResult<View, Error, {
    workspaceId: string;
    viewId: string;
    data: Record<string, unknown>;
}, unknown>;
declare function useDeleteView(): _tanstack_react_query.UseMutationResult<void, Error, {
    workspaceId: string;
    viewId: string;
}, unknown>;

interface NavigationAdapter {
    navigate: (path: string) => void;
    goBack: () => void;
    getCurrentPath?: () => string;
}
declare const NAV_PATHS: {
    readonly HOME: "/";
    readonly ISSUES: "/issues";
    readonly MY_ISSUES: "/issues?filter=my";
    readonly AGENTS: "/agents";
    readonly RUNTIMES: "/runtimes";
    readonly PROJECTS: "/projects";
    readonly INBOX: "/inbox";
    readonly CHAT: "/chat";
    readonly SEARCH: "/search";
    readonly SETTINGS: "/settings";
    readonly LOGIN: "/login";
};

interface CoreProviderProps {
    children: ReactNode;
    navigation?: NavigationAdapter;
    onUnauthorized?: () => void;
}
declare const CoreProvider: React.FC<CoreProviderProps>;

interface AuthInitializerProps {
    children: ReactNode;
    onUnauthorized?: () => void;
}
/**
 * Restores auth state from localStorage on mount.
 * Must wrap the app at the top level.
 */
declare const AuthInitializer: React.FC<AuthInitializerProps>;

export { Agent, Attachment, AuthInitializer, ChatMessage, ChatSession, Comment, CoreProvider, type Cycle, InboxItem, Issue, IssuePriority, IssueReaction, IssueStatus, IssueSubscriber, type Label, MemberWithUser, NAV_PATHS, type NavigationAdapter, OpenZooRealtimeClient, PinnedItem, Project, Reaction, RuntimeDevice, Skill, Task, TaskMessage, TimelineEntry, TypedWSEvent, User, type View, WSEventType, Workspace, addIssueReaction, addReaction, archiveAgent, archiveChatSession, attachRealtimeSync, batchUpdateIssues, cancelTask, configureApiClient, connectGlobal, createAgent, createChatSession, createComment, createIssue, createMember, createPin, createProject, createSkill, createTask, createWorkspace, deleteAttachment, deleteComment, deleteIssue, deleteMember, deletePin, deleteProject, deleteRuntime, deleteSkill, deleteWorkspace, disconnectGlobal, getAgent, getApiClient, getChatSession, getCurrentUser, getIssue, getProject, getQueryData, getRuntime, getTask, getToken, getWorkspace, getWorkspaceId, invalidateQuery, issueKeys, listAgents, listChatMessages, listChatSessions, listComments, listInbox, listIssueSubscribers, listIssues, listMembers, listPins, listProjects, listRuntimeUsage, listRuntimes, listSkills, listTaskMessages, listTasks, listTimeline, listWorkspaces, markAllInboxRead, markInboxArchived, markInboxRead, onUnauthorized, pingRuntime, queryClient, registerRuntime, removeIssueReaction, removeReaction, reorderPins, restoreAgent, searchIssues, searchProjects, sendChatMessage, sendVerificationCode, setAgentSkills, setQueryData, setToken, setWorkspaceId, subscribeIssue, unsubscribeIssue, updateAgent, updateComment, updateCurrentUser, updateIssue, updateMember, updateProject, updateRuntime, updateSkill, updateTaskStatus, updateWorkspace, uploadAttachment, useAddIssueReaction, useAddIssueToCycle, useAddLabelToIssue, useAddReaction, useAgent, useAgents, useArchiveAgent, useAuthStore, useChatMessages, useChatSession, useChatSessions, useComments, useCreateAgent, useCreateChatSession, useCreateComment, useCreateCycle, useCreateIssue, useCreateLabel, useCreateMember, useCreateProject, useCreateSkill, useCreateView, useCreateWorkspace, useCycle, useCycles, useDeleteComment, useDeleteCycle, useDeleteIssue, useDeleteLabel, useDeleteMember, useDeleteProject, useDeleteRuntime, useDeleteSkill, useDeleteView, useDeleteWorkspace, useInbox, useIssue, useIssueLabels, useIssueSubscribers, useIssueViewStore, useIssues, useLabels, useMarkAllInboxRead, useMarkInboxArchived, useMarkInboxRead, useMembers, usePingRuntime, useProject, useProjects, useRegisterRuntime, useRemoveIssueFromCycle, useRemoveIssueReaction, useRemoveLabelFromIssue, useRemoveReaction, useRestoreAgent, useRuntime, useRuntimeUsage, useRuntimes, useSendChatMessage, useSkills, useSubscribeIssue, useTimeline, useUnsubscribeIssue, useUpdateAgent, useUpdateComment, useUpdateCycle, useUpdateIssue, useUpdateLabel, useUpdateMember, useUpdateProject, useUpdateRuntime, useUpdateSkill, useUpdateView, useUpdateWorkspace, useView, useViews, useWSEvent, useWorkspace, useWorkspaceStore, useWorkspaces, verifyCode };
