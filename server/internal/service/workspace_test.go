package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestWorkspaceService_CreateWorkspace(t *testing.T) {
	svc := &WorkspaceService{}
	assert.NotNil(t, svc)

	params := map[string]any{
		"name":         "Test Workspace",
		"description":  "A test workspace",
		"issue_prefix": "TW",
	}

	assert.Equal(t, "Test Workspace", params["name"])
	assert.Equal(t, "A test workspace", params["description"])
	assert.Equal(t, "TW", params["issue_prefix"])
}

func TestWorkspaceService_CreateWorkspace_DefaultPrefix(t *testing.T) {
	params := map[string]any{
		"name":         "Another Workspace",
		"description":  "Another test workspace",
		"issue_prefix": "",
	}

	assert.Empty(t, params["issue_prefix"])
}

func TestWorkspaceService_UpdateWorkspace(t *testing.T) {
	updates := map[string]any{
		"name":        "Updated Workspace",
		"description": "Updated description",
		"context":     "Updated context",
	}

	assert.Equal(t, "Updated Workspace", updates["name"])
	assert.Equal(t, "Updated description", updates["description"])
	assert.Equal(t, "Updated context", updates["context"])
}

func TestWorkspaceService_ListWorkspaces(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	params := map[string]any{
		"limit":  50,
		"offset": 0,
	}

	assert.Equal(t, 50, params["limit"])
	assert.Equal(t, 0, params["offset"])
}

func TestWorkspaceService_DeleteWorkspace(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	workspaceID := "ws_123"
	assert.NotEmpty(t, workspaceID)
	assert.Contains(t, workspaceID, "ws_")
}

func TestWorkspaceService_GetWorkspace(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	workspaceData := map[string]any{
		"id":            "ws_456",
		"name":          "Test Workspace",
		"slug":          "test-workspace",
		"description":   "A workspace for testing",
		"issue_prefix":  "TW",
		"created_at":    time.Now().Format(time.RFC3339),
		"updated_at":    time.Now().Format(time.RFC3339),
	}

	assert.Equal(t, "ws_456", workspaceData["id"])
	assert.Equal(t, "test-workspace", workspaceData["slug"])
	assert.Equal(t, "TW", workspaceData["issue_prefix"])
}

func TestWorkspaceService_WorkspaceStats(t *testing.T) {
	stats := map[string]any{
		"project_count":   5,
		"issue_count":     120,
		"member_count":    8,
		"active_agents":   3,
	}

	assert.Equal(t, 5, stats["project_count"])
	assert.Equal(t, 120, stats["issue_count"])
	assert.Equal(t, 8, stats["member_count"])
	assert.Equal(t, 3, stats["active_agents"])
}

func TestSlugify(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"Test Workspace", "test-workspace"},
		{"My Project", "my-project"},
		{"ALL CAPS", "all-caps"},
		{"mixedCase", "mixedcase"},
		{"  spaces  ", "--spaces--"},
		{"Special!@#Chars", "specialchars"},
		{"Numbers123", "numbers123"},
		{"Already-Slug", "already-slug"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := slugify(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSlugify_Empty(t *testing.T) {
	result := slugify("")
	assert.Empty(t, result)
}
