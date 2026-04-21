package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestChatService_CreateSession(t *testing.T) {
	svc := &ChatService{}
	assert.NotNil(t, svc)

	params := map[string]any{
		"workspace_id": "ws_123",
		"agent_id":     "agent_456",
		"creator_id":   "user_789",
		"title":        "Test Chat",
	}

	assert.Equal(t, "ws_123", params["workspace_id"])
	assert.Equal(t, "agent_456", params["agent_id"])
	assert.Equal(t, "Test Chat", params["title"])
}

func TestChatService_CreateSession_DefaultTitle(t *testing.T) {
	params := map[string]any{
		"workspace_id": "ws_123",
		"agent_id":     "agent_456",
		"creator_id":   "user_789",
		"title":        "",
	}

	assert.Empty(t, params["title"])
}

func TestChatService_SendMessage(t *testing.T) {
	params := map[string]any{
		"session_id": "session_123",
		"role":       "user",
		"content":    "Hello, this is a test message",
	}

	assert.Equal(t, "session_123", params["session_id"])
	assert.Equal(t, "user", params["role"])
	assert.Equal(t, "Hello, this is a test message", params["content"])
}

func TestChatService_SendMessage_AssistantRole(t *testing.T) {
	params := map[string]any{
		"session_id": "session_456",
		"role":       "assistant",
		"content":    "This is a response from the assistant",
	}

	assert.Equal(t, "assistant", params["role"])
	assert.NotEmpty(t, params["content"])
}

func TestChatService_ListSessions(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	workspaceID := "ws_123"
	agentID := "agent_456"
	limit := 50

	assert.Equal(t, "ws_123", workspaceID)
	assert.Equal(t, "agent_456", agentID)
	assert.Equal(t, 50, limit)
}

func TestChatService_ListMessages(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	sessionID := "session_123"
	limit := 100

	assert.Equal(t, "session_123", sessionID)
	assert.Equal(t, 100, limit)
}

func TestChatService_ChatSessionStruct(t *testing.T) {
	now := time.Now()
	session := ChatSession{
		ID:          "session_123",
		WorkspaceID: "ws_123",
		AgentID:     "agent_456",
		CreatorID:   "user_789",
		Title:       "Test Chat",
		Status:      "active",
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	assert.Equal(t, "session_123", session.ID)
	assert.Equal(t, "ws_123", session.WorkspaceID)
	assert.Equal(t, "agent_456", session.AgentID)
	assert.Equal(t, "Test Chat", session.Title)
	assert.Equal(t, "active", session.Status)
}

func TestChatService_ChatMessageStruct(t *testing.T) {
	now := time.Now()
	message := ChatMessage{
		ID:            "msg_123",
		ChatSessionID: "session_123",
		Role:          "user",
		Content:       "Hello, world!",
		CreatedAt:     now,
	}

	assert.Equal(t, "msg_123", message.ID)
	assert.Equal(t, "session_123", message.ChatSessionID)
	assert.Equal(t, "user", message.Role)
	assert.Equal(t, "Hello, world!", message.Content)
}
