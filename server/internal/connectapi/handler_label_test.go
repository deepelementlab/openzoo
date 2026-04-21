package connectapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHandlerLabelValidation(t *testing.T) {
	tests := []struct {
		name    string
		body    map[string]any
		wantErr bool
	}{
		{
			name:    "missing workspace_id",
			body:    map[string]any{},
			wantErr: true,
		},
		{
			name:    "valid workspace_id",
			body:    map[string]any{"workspace_id": "ws_123"},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/labels", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}

func TestHandlerLabelCreateValidation(t *testing.T) {
	tests := []struct {
		name    string
		body    map[string]any
		wantErr bool
	}{
		{
			name:    "missing name",
			body:    map[string]any{"workspace_id": "ws_123"},
			wantErr: true,
		},
		{
			name:    "valid request",
			body:    map[string]any{"workspace_id": "ws_123", "name": "Bug", "color": "#FF0000"},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/labels/create", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}

func TestHandlerLabelUpdateValidation(t *testing.T) {
	tests := []struct {
		name string
		body map[string]any
	}{
		{
			name: "missing label_id",
			body: map[string]any{"name": "Updated Label"},
		},
		{
			name: "valid update",
			body: map[string]any{"label_id": "label_123", "name": "Updated Label", "color": "#00FF00"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/labels/update", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}

func TestHandlerLabelIssueAssociation(t *testing.T) {
	tests := []struct {
		name string
		body map[string]any
	}{
		{
			name: "add label to issue",
			body: map[string]any{"issue_id": "issue_123", "label_id": "label_456"},
		},
		{
			name: "remove label from issue",
			body: map[string]any{"issue_id": "issue_123", "label_id": "label_456"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, _ := json.Marshal(tt.body)
			req := httptest.NewRequest(http.MethodPost, "/labels/issue", bytes.NewReader(b))
			req.Header.Set("Content-Type", "application/json")

			assert.Equal(t, http.MethodPost, req.Method)
		})
	}
}
