﻿﻿﻿﻿﻿﻿﻿﻿// API Client
export { getApiClient, configureApiClient, setToken, getToken, setWorkspaceId, getWorkspaceId, onUnauthorized } from "./api/connect-client";

// Types
export type * from "./types";

// Query Client
export { queryClient, invalidateQuery, setQueryData, getQueryData } from "./query-client";

// Auth store & queries
export { useAuthStore } from "./auth/store";
export { sendVerificationCode, verifyCode, getCurrentUser, updateCurrentUser } from "./auth/queries";

// Workspace store, queries & hooks
export { useWorkspaceStore } from "./workspace/store";
export {
  listWorkspaces, getWorkspace, createWorkspace, updateWorkspace, deleteWorkspace,
  listMembers, createMember, updateMember, deleteMember,
} from "./workspace/queries";
export {
  useWorkspaces, useWorkspace, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace,
  useMembers, useCreateMember, useUpdateMember, useDeleteMember,
} from "./workspace/hooks";

// Issue queries, mutations, store & hooks
export { listIssues, getIssue, searchIssues, listIssueSubscribers, issueKeys } from "./issues/queries";
export { createIssue, updateIssue, deleteIssue, batchUpdateIssues, addIssueReaction, removeIssueReaction, subscribeIssue, unsubscribeIssue } from "./issues/mutations";
export { useIssueViewStore } from "./issues/stores";
export {
  useIssues, useIssue, useCreateIssue, useUpdateIssue, useDeleteIssue,
  useAddIssueReaction, useRemoveIssueReaction,
  useIssueSubscribers, useSubscribeIssue, useUnsubscribeIssue,
} from "./issues/hooks";

// Agent queries & hooks
export { listAgents, getAgent, createAgent, updateAgent, archiveAgent, restoreAgent, setAgentSkills } from "./agents/queries";
export { listSkills, createSkill, updateSkill, deleteSkill } from "./agents/queries";
export {
  useAgents, useAgent, useCreateAgent, useUpdateAgent, useArchiveAgent, useRestoreAgent,
  useSkills, useCreateSkill, useUpdateSkill, useDeleteSkill,
} from "./agents/hooks";

// Runtime queries, mutations & hooks
export { listRuntimes, registerRuntime, getRuntime, pingRuntime, listRuntimeUsage, startEmbeddedDaemon, stopEmbeddedDaemon, getEmbeddedDaemonStatus } from "./runtimes/queries";
export { updateRuntime, deleteRuntime } from "./runtimes/mutations";
export {
  useRuntimes, useRuntime, useRegisterRuntime, useUpdateRuntime, useDeleteRuntime,
  useRuntimeUsage, usePingRuntime,
} from "./runtimes/hooks";

// External sessions queries, mutations & hooks
export { discoverExternalSessions, listExternalSessions, monitorExternalSession, adoptExternalSession, releaseExternalSession } from "./external-sessions/queries";
export type { ExternalSession, DiscoverResult } from "./external-sessions/queries";
export {
  useExternalSessions, useDiscoverExternalSessions, useMonitorExternalSession, useAdoptExternalSession, useReleaseExternalSession,
} from "./external-sessions/hooks";

// Task queries
export { createTask, getTask, listTasks, updateTaskStatus, cancelTask, listTaskMessages } from "./tasks/queries";

// Chat queries & hooks
export {
  listChatSessions, getChatSession, createChatSession, archiveChatSession,
  listChatMessages, sendChatMessage,
} from "./chat/queries";
export {
  useChatSessions, useChatSession, useChatMessages, useCreateChatSession, useSendChatMessage,
} from "./chat/hooks";

// Comment queries & hooks
export {
  listComments, createComment, updateComment, deleteComment,
  addReaction, removeReaction, listTimeline, uploadAttachment, deleteAttachment,
} from "./comments/queries";
export {
  useComments, useCreateComment, useUpdateComment, useDeleteComment,
  useAddReaction, useRemoveReaction, useTimeline,
} from "./comments/hooks";

// Inbox queries & hooks
export { listInbox, markInboxRead, markInboxArchived, markAllInboxRead } from "./inbox/queries";
export {
  useInbox, useMarkInboxRead, useMarkInboxArchived, useMarkAllInboxRead,
} from "./inbox/hooks";

// Project & Pin queries & hooks
export {
  listProjects, getProject, createProject, updateProject, deleteProject, searchProjects,
  listPins, createPin, deletePin, reorderPins,
} from "./projects/queries";
export {
  useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject,
} from "./projects/hooks";

// Realtime
export { OpenZooRealtimeClient, useWSEvent, connectGlobal, disconnectGlobal } from "./realtime/centrifugo-provider";
export { attachRealtimeSync } from "./realtime/use-realtime-sync";

// Cycles
export {
  useCycles, useCycle, useCreateCycle, useUpdateCycle, useDeleteCycle,
  useAddIssueToCycle, useRemoveIssueFromCycle,
} from "./cycles/hooks";
export type { Cycle } from "./cycles/queries";

// Labels
export {
  useLabels, useIssueLabels, useCreateLabel, useUpdateLabel, useDeleteLabel,
  useAddLabelToIssue, useRemoveLabelFromIssue,
} from "./labels/hooks";
export type { Label } from "./labels/queries";

// Views
export {
  useViews, useView, useCreateView, useUpdateView, useDeleteView,
} from "./views/hooks";
export type { View } from "./views/queries";

// Event types
export type { WSEventType, TypedWSEvent, EventPayloadMap } from "./types/events";

// Platform
export { CoreProvider } from "./platform/core-provider";
export { AuthInitializer } from "./platform/auth-initializer";

// Navigation
export { type NavigationAdapter, NAV_PATHS } from "./navigation/types";
