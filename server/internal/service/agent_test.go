package service

import (
	"encoding/json"
	"testing"
	"time"
)

func TestAllowedAgentFields_ContainsRequiredFields(t *testing.T) {
	required := []string{"name", "description", "instructions", "visibility", "status",
		"max_concurrent_tasks", "runtime_id", "runtime_mode", "runtime_config", "updated_at"}
	for _, field := range required {
		if !allowedAgentFields[field] {
			t.Errorf("allowedAgentFields missing required field: %s", field)
		}
	}
}

func TestAllowedSkillFields_ContainsRequiredFields(t *testing.T) {
	required := []string{"name", "description", "content", "updated_at"}
	for _, field := range required {
		if !allowedSkillFields[field] {
			t.Errorf("allowedSkillFields missing required field: %s", field)
		}
	}
}

func TestAllowedAgentFields_ExcludesSensitiveFields(t *testing.T) {
	forbidden := []string{"id", "workspace_id", "owner_id", "archived_at", "archived_by", "created_at"}
	for _, field := range forbidden {
		if allowedAgentFields[field] {
			t.Errorf("allowedAgentFields should not contain sensitive field: %s", field)
		}
	}
}

func TestBuildSetClauses_AllowedFields(t *testing.T) {
	fields := map[string]interface{}{
		"name":        "test-agent",
		"description": "desc",
		"status":      "idle",
	}
	clauses, args, next := buildSetClauses(fields, allowedAgentFields, 3)
	if clauses == "" {
		t.Fatal("expected non-empty clauses")
	}
	if len(args) != 3 {
		t.Fatalf("expected 3 args, got %d", len(args))
	}
	if next != 6 {
		t.Fatalf("expected next arg index 6, got %d", next)
	}
}

func TestBuildSetClauses_RejectsUnknownFields(t *testing.T) {
	fields := map[string]interface{}{
		"name":           "test",
		"id":             "should-be-rejected",
		"workspace_id":   "should-be-rejected",
		"owner_id":       "should-be-rejected",
		"'; DROP TABLE":  "sql-injection",
	}
	clauses, args, _ := buildSetClauses(fields, allowedAgentFields, 1)
	if len(args) != 1 {
		t.Fatalf("expected 1 arg (only name), got %d: %v", len(args), args)
	}
	if args[0] != "test" {
		t.Fatalf("expected 'test', got %v", args[0])
	}
	for _, c := range []string{"DROP TABLE", "workspace_id", "owner_id"} {
		if contains(clauses, c) {
			t.Errorf("clauses should not contain %q, got: %s", c, clauses)
		}
	}
}

func TestBuildSetClauses_EmptyInput(t *testing.T) {
	clauses, args, next := buildSetClauses(nil, allowedAgentFields, 1)
	if clauses != "" {
		t.Errorf("expected empty clauses for nil input, got: %s", clauses)
	}
	if len(args) != 0 {
		t.Errorf("expected 0 args, got %d", len(args))
	}
	if next != 1 {
		t.Errorf("expected next=1, got %d", next)
	}
}

func TestAgentStruct_JSONSerialization(t *testing.T) {
	now := time.Now()
	a := Agent{
		ID:                "test-id",
		WorkspaceID:       "ws-1",
		Name:              "Test Agent",
		RuntimeMode:       "local",
		RuntimeConfig:     "{}",
		MaxConcurrentTask: 6,
		OwnerID:           "user-1",
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	data, err := json.Marshal(a)
	if err != nil {
		t.Fatalf("failed to marshal agent: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	if m["runtime_mode"] != "local" {
		t.Errorf("expected runtime_mode=local, got %v", m["runtime_mode"])
	}
	if m["max_concurrent_tasks"] != float64(6) {
		t.Errorf("expected max_concurrent_tasks=6, got %v", m["max_concurrent_tasks"])
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstr(s, substr))
}

func containsSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
