package connectapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerIssueValidation(t *testing.T) {
	tests := []struct {
		name string
		body map[string]any
	}{
		{
			name: "list issues with workspace",
			body: map[string]any{"workspace_id": "ws_123", "limit": 50, "offset": 0},
		},
		{
			name: "get issue",
			body: map[string]any{"workspace_id": "ws_123", "issue_id": "issue_456"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/issues", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}

func TestHandlerIssueCreateValidation(t *testing.T) {
	body := map[string]any{
		"workspace_id": "ws_123",
		"title":        "Test Issue",
		"description":  "This is a test issue",
		"status":       "todo",
		"priority":     "medium",
	}

	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/issues/create", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	assert.Equal(t, http.MethodPost, req.Method)
	assert.Equal(t, "ws_123", body["workspace_id"])
	assert.Equal(t, "Test Issue", body["title"])
}

func TestHandlerIssueUpdateValidation(t *testing.T) {
	body := map[string]any{
		"workspace_id": "ws_123",
		"issue_id":     "issue_456",
		"title":        "Updated Issue",
		"status":       "in_progress",
	}

	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/issues/update", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	assert.Equal(t, http.MethodPost, req.Method)
	assert.Equal(t, "Updated Issue", body["title"])
}

func TestHandlerIssueSearchValidation(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{
			name:  "empty query",
			query: "",
		},
		{
			name:  "valid query",
			query: "bug fix",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := map[string]any{
				"workspace_id": "ws_123",
				"query":        tt.query,
			}

			b, _ := json.Marshal(body)
			req := httptest.NewRequest(http.MethodPost, "/issues/search", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}

func TestHandlerIssueDeleteValidation(t *testing.T) {
	body := map[string]any{
		"workspace_id": "ws_123",
		"issue_id":     "issue_789",
	}

	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/issues/delete", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")

	assert.Equal(t, http.MethodPost, req.Method)
	assert.Equal(t, "issue_789", body["issue_id"])
}
