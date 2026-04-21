package events

import (
	"sync"
	"time"
)

type Event struct {
	Type        string      `json:"type"`
	WorkspaceID string      `json:"workspace_id"`
	ActorID     string      `json:"actor_id"`
	ActorType   string      `json:"actor_type"`
	Payload     interface{} `json:"payload"`
	Timestamp   time.Time   `json:"timestamp"`
}

type HandlerFunc func(evt Event)

type Bus struct {
	mu              sync.RWMutex
	subscribers     map[string][]HandlerFunc
	globalHandlers  []HandlerFunc
}

var defaultBus *Bus
var busOnce sync.Once

func GetBus() *Bus {
	busOnce.Do(func() {
		defaultBus = &Bus{
			subscribers: make(map[string][]HandlerFunc),
		}
	})
	return defaultBus
}

func (b *Bus) Subscribe(eventType string, handler HandlerFunc) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.subscribers[eventType] = append(b.subscribers[eventType], handler)
}

func (b *Bus) SubscribeAll(handler HandlerFunc) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.globalHandlers = append(b.globalHandlers, handler)
}

func (b *Bus) Publish(evt Event) {
	evt.Timestamp = time.Now()

	b.mu.RLock()
	typeHandlers := b.subscribers[evt.Type]
	globalHandlers := make([]HandlerFunc, len(b.globalHandlers))
	copy(globalHandlers, b.globalHandlers)
	b.mu.RUnlock()

	for _, h := range typeHandlers {
		h(evt)
	}
	for _, h := range globalHandlers {
		h(evt)
	}
}

const (
	EventIssueCreated      = "issue:created"
	EventIssueUpdated      = "issue:updated"
	EventIssueDeleted      = "issue:deleted"
	EventCommentCreated    = "comment:created"
	EventCommentUpdated    = "comment:updated"
	EventCommentDeleted    = "comment:deleted"
	EventReactionAdded     = "reaction:added"
	EventReactionRemoved   = "reaction:removed"
	EventIssueReactionAdded   = "issue_reaction:added"
	EventIssueReactionRemoved = "issue_reaction:removed"
	EventAgentCreated      = "agent:created"
	EventAgentArchived     = "agent:archived"
	EventAgentRestored     = "agent:restored"
	EventAgentStatus       = "agent:status"
	EventTaskDispatch      = "task:dispatch"
	EventTaskProgress      = "task:progress"
	EventTaskCompleted     = "task:completed"
	EventTaskFailed        = "task:failed"
	EventTaskMessage       = "task:message"
	EventTaskCancelled     = "task:cancelled"
	EventInboxNew          = "inbox:new"
	EventInboxRead         = "inbox:read"
	EventInboxArchived     = "inbox:archived"
	EventWorkspaceCreated  = "workspace:created"
	EventWorkspaceUpdated  = "workspace:updated"
	EventWorkspaceDeleted  = "workspace:deleted"
	EventMemberAdded       = "member:added"
	EventMemberUpdated     = "member:updated"
	EventMemberRemoved     = "member:removed"
	EventMemberOnline      = "member:online"
	EventMemberOffline     = "member:offline"
	EventSubscriberAdded   = "subscriber:added"
	EventSubscriberRemoved = "subscriber:removed"
	EventActivityCreated   = "activity:created"
	EventSkillCreated      = "skill:created"
	EventSkillUpdated      = "skill:updated"
	EventSkillDeleted      = "skill:deleted"
	EventChatMessage       = "chat:message"
	EventChatDone          = "chat:done"
	EventProjectCreated    = "project:created"
	EventProjectUpdated    = "project:updated"
	EventProjectDeleted    = "project:deleted"
	EventPinCreated        = "pin:created"
	EventPinDeleted        = "pin:deleted"
	EventDaemonHeartbeat   = "daemon:heartbeat"
	EventDaemonRegister    = "daemon:register"
	EventRuntimeRegistered = "runtime:registered"
)
