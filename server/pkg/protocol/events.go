package protocol

const (
	EventIssueCreated = "issue:created"
	EventIssueUpdated = "issue:updated"
	EventIssueDeleted = "issue:deleted"

	EventCommentCreated   = "comment:created"
	EventCommentUpdated   = "comment:updated"
	EventCommentDeleted   = "comment:deleted"
	EventReactionAdded    = "reaction:added"
	EventReactionRemoved  = "reaction:removed"
	EventIssueReactionAdded   = "issue_reaction:added"
	EventIssueReactionRemoved = "issue_reaction:removed"

	EventAgentStatus   = "agent:status"
	EventAgentCreated  = "agent:created"
	EventAgentArchived = "agent:archived"
	EventAgentRestored = "agent:restored"

	EventTaskDispatch  = "task:dispatch"
	EventTaskProgress  = "task:progress"
	EventTaskCompleted = "task:completed"
	EventTaskFailed    = "task:failed"
	EventTaskMessage   = "task:message"
	EventTaskCancelled = "task:cancelled"

	EventInboxNew           = "inbox:new"
	EventInboxRead          = "inbox:read"
	EventInboxArchived      = "inbox:archived"
	EventInboxBatchRead     = "inbox:batch-read"
	EventInboxBatchArchived = "inbox:batch-archived"

	EventWorkspaceUpdated = "workspace:updated"
	EventWorkspaceDeleted = "workspace:deleted"

	EventMemberAdded   = "member:added"
	EventMemberUpdated = "member:updated"
	EventMemberRemoved = "member:removed"
	EventMemberOnline  = "member:online"
	EventMemberOffline = "member:offline"

	EventSubscriberAdded   = "subscriber:added"
	EventSubscriberRemoved = "subscriber:removed"

	EventActivityCreated = "activity:created"

	EventSkillCreated = "skill:created"
	EventSkillUpdated = "skill:updated"
	EventSkillDeleted = "skill:deleted"

	EventChatMessage = "chat:message"
	EventChatDone    = "chat:done"

	EventProjectCreated = "project:created"
	EventProjectUpdated = "project:updated"
	EventProjectDeleted = "project:deleted"

	EventPinCreated = "pin:created"
	EventPinDeleted = "pin:deleted"

	EventDaemonHeartbeat = "daemon:heartbeat"
	EventDaemonRegister  = "daemon:register"

	EventLabelCreated = "label:created"
	EventLabelUpdated = "label:updated"
	EventLabelDeleted = "label:deleted"

	EventCycleCreated = "cycle:created"
	EventCycleUpdated = "cycle:updated"
	EventCycleDeleted = "cycle:deleted"
)
