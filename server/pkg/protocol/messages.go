package protocol

import "encoding/json"

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type TaskDispatchPayload struct {
	TaskID      string `json:"task_id"`
	IssueID     string `json:"issue_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type TaskProgressPayload struct {
	TaskID  string `json:"task_id"`
	Summary string `json:"summary"`
	Step    int    `json:"step,omitempty"`
	Total   int    `json:"total,omitempty"`
}

type TaskCompletedPayload struct {
	TaskID string `json:"task_id"`
	PRURL  string `json:"pr_url,omitempty"`
	Output string `json:"output,omitempty"`
}

type TaskMessagePayload struct {
	TaskID  string         `json:"task_id"`
	IssueID string         `json:"issue_id,omitempty"`
	Seq     int            `json:"seq"`
	Type    string         `json:"type"`
	Tool    string         `json:"tool,omitempty"`
	Content string         `json:"content,omitempty"`
	Input   map[string]any `json:"input,omitempty"`
	Output  string         `json:"output,omitempty"`
}

type DaemonRegisterPayload struct {
	DaemonID string        `json:"daemon_id"`
	AgentID  string        `json:"agent_id"`
	Runtimes []RuntimeInfo `json:"runtimes"`
}

type RuntimeInfo struct {
	Type    string `json:"type"`
	Version string `json:"version"`
	Status  string `json:"status"`
}

type ChatMessagePayload struct {
	ChatSessionID string `json:"chat_session_id"`
	MessageID     string `json:"message_id"`
	Role          string `json:"role"`
	Content       string `json:"content"`
	TaskID        string `json:"task_id,omitempty"`
	CreatedAt     string `json:"created_at"`
}

type ChatDonePayload struct {
	ChatSessionID string `json:"chat_session_id"`
	TaskID        string `json:"task_id"`
	Content       string `json:"content"`
}

type HeartbeatPayload struct {
	DaemonID     string `json:"daemon_id"`
	AgentID      string `json:"agent_id"`
	CurrentTasks int    `json:"current_tasks"`
}

type MemberPresencePayload struct {
	UserID string `json:"user_id"`
	Online bool   `json:"online"`
}

type IssueEventPayload struct {
	IssueID      string `json:"issue_id"`
	WorkspaceID  string `json:"workspace_id"`
	Identifier   string `json:"identifier,omitempty"`
	Title        string `json:"title,omitempty"`
	ActorID      string `json:"actor_id,omitempty"`
	ActorType    string `json:"actor_type,omitempty"`
}

type CommentEventPayload struct {
	CommentID   string `json:"comment_id"`
	IssueID     string `json:"issue_id"`
	WorkspaceID string `json:"workspace_id"`
	ActorID     string `json:"actor_id,omitempty"`
}

type ActivityEventPayload struct {
	ActivityID  string `json:"activity_id"`
	WorkspaceID string `json:"workspace_id"`
	ActorID     string `json:"actor_id,omitempty"`
	ActorType   string `json:"actor_type,omitempty"`
	Action      string `json:"action,omitempty"`
	TargetType  string `json:"target_type,omitempty"`
	TargetID    string `json:"target_id,omitempty"`
}
