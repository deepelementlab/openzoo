package protocol

import (
	"encoding/json"
	"testing"
)

func TestEventConstants(t *testing.T) {
	events := []string{
		EventIssueCreated, EventIssueUpdated, EventIssueDeleted,
		EventCommentCreated, EventCommentUpdated, EventCommentDeleted,
		EventReactionAdded, EventReactionRemoved,
		EventAgentStatus, EventAgentCreated, EventAgentArchived,
		EventTaskDispatch, EventTaskProgress, EventTaskCompleted, EventTaskFailed,
		EventInboxNew, EventInboxRead,
		EventWorkspaceUpdated,
		EventMemberAdded, EventMemberRemoved, EventMemberOnline, EventMemberOffline,
		EventSubscriberAdded, EventSubscriberRemoved,
		EventActivityCreated,
		EventSkillCreated, EventSkillUpdated, EventSkillDeleted,
		EventChatMessage, EventChatDone,
		EventProjectCreated, EventProjectUpdated, EventProjectDeleted,
		EventPinCreated, EventPinDeleted,
		EventDaemonHeartbeat, EventDaemonRegister,
		EventLabelCreated, EventLabelUpdated,
		EventCycleCreated, EventCycleUpdated,
	}
	for _, e := range events {
		if e == "" {
			t.Fatal("expected non-empty event constant")
		}
	}
}

func TestMessageSerialization(t *testing.T) {
	msg := Message{
		Type:    EventIssueCreated,
		Payload: json.RawMessage(`{"issue_id":"123"}`),
	}
	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}
	var decoded Message
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}
	if decoded.Type != EventIssueCreated {
		t.Fatalf("expected %s, got %s", EventIssueCreated, decoded.Type)
	}
}

func TestTaskDispatchPayload(t *testing.T) {
	p := TaskDispatchPayload{
		TaskID:      "task-1",
		IssueID:     "issue-1",
		Title:       "Fix bug",
		Description: "There is a bug",
	}
	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}
	var decoded TaskDispatchPayload
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}
	if decoded.TaskID != "task-1" {
		t.Fatalf("expected task-1, got %s", decoded.TaskID)
	}
}

func TestChatMessagePayload(t *testing.T) {
	p := ChatMessagePayload{
		ChatSessionID: "session-1",
		MessageID:     "msg-1",
		Role:          "assistant",
		Content:       "Hello!",
		CreatedAt:     "2026-01-01T00:00:00Z",
	}
	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}
	var decoded ChatMessagePayload
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}
	if decoded.Role != "assistant" {
		t.Fatalf("expected assistant, got %s", decoded.Role)
	}
}

func TestHeartbeatPayload(t *testing.T) {
	p := HeartbeatPayload{
		DaemonID:     "daemon-1",
		AgentID:      "agent-1",
		CurrentTasks: 3,
	}
	data, _ := json.Marshal(p)
	var decoded HeartbeatPayload
	json.Unmarshal(data, &decoded)
	if decoded.CurrentTasks != 3 {
		t.Fatalf("expected 3, got %d", decoded.CurrentTasks)
	}
}

func TestDaemonRegisterPayload(t *testing.T) {
	p := DaemonRegisterPayload{
		DaemonID: "daemon-1",
		AgentID:  "agent-1",
		Runtimes: []RuntimeInfo{
			{Type: "claude", Version: "1.0", Status: "active"},
		},
	}
	data, _ := json.Marshal(p)
	var decoded DaemonRegisterPayload
	json.Unmarshal(data, &decoded)
	if len(decoded.Runtimes) != 1 {
		t.Fatalf("expected 1 runtime, got %d", len(decoded.Runtimes))
	}
	if decoded.Runtimes[0].Type != "claude" {
		t.Fatalf("expected claude, got %s", decoded.Runtimes[0].Type)
	}
}
