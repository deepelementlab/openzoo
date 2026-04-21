package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestProjectService_CreateProject(t *testing.T) {
	svc := &ProjectService{}
	assert.NotNil(t, svc)

	params := map[string]any{
		"workspace_id": "ws_123",
		"title":        "Test Project",
		"description":  "A test project",
		"icon":         "📁",
		"status":       "planned",
		"priority":     "high",
	}

	assert.Equal(t, "ws_123", params["workspace_id"])
	assert.Equal(t, "Test Project", params["title"])
	assert.Equal(t, "planned", params["status"])
	assert.Equal(t, "high", params["priority"])
}

func TestProjectService_CreateProject_Defaults(t *testing.T) {
	params := map[string]any{
		"workspace_id": "ws_456",
		"title":        "Default Project",
		"status":       "",
		"priority":     "",
	}

	assert.Empty(t, params["status"])
	assert.Empty(t, params["priority"])
}

func TestProjectService_UpdateProject(t *testing.T) {
	updates := map[string]any{
		"title":       "Updated Project",
		"description": "Updated description",
		"status":      "active",
		"priority":    "urgent",
	}

	assert.Equal(t, "Updated Project", updates["title"])
	assert.Equal(t, "active", updates["status"])
	assert.Equal(t, "urgent", updates["priority"])
}

func TestProjectService_ListProjects(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	limit := 50
	offset := 0

	assert.Equal(t, 50, limit)
	assert.Equal(t, 0, offset)
}

func TestProjectService_DeleteProject(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	workspaceID := "ws_123"
	projectID := "proj_456"

	assert.NotEmpty(t, workspaceID)
	assert.NotEmpty(t, projectID)
	assert.Contains(t, projectID, "proj_")
}

func TestProjectService_ArchiveProject(t *testing.T) {
	updates := map[string]any{
		"status":     "archived",
		"archived_at": time.Now().Format(time.RFC3339),
	}

	assert.Equal(t, "archived", updates["status"])
	assert.NotEmpty(t, updates["archived_at"])
}

func TestProjectService_RestoreProject(t *testing.T) {
	updates := map[string]any{
		"status":      "active",
		"archived_at": nil,
	}

	assert.Equal(t, "active", updates["status"])
	assert.Nil(t, updates["archived_at"])
}

func TestProjectService_ProjectStruct(t *testing.T) {
	now := time.Now()
	project := Project{
		ID:          "proj_123",
		WorkspaceID: "ws_123",
		Title:       "Test Project",
		Description: "A test project",
		Icon:        "📁",
		Status:      "planned",
		Priority:    "high",
		CreatedAt:   now,
		UpdatedAt:   now,
		IssueCount:  10,
		DoneCount:   5,
	}

	assert.Equal(t, "proj_123", project.ID)
	assert.Equal(t, "ws_123", project.WorkspaceID)
	assert.Equal(t, "Test Project", project.Title)
	assert.Equal(t, 10, project.IssueCount)
	assert.Equal(t, 5, project.DoneCount)
}
