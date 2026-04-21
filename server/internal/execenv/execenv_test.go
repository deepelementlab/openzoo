package execenv

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestPrepare_CreatesWorkdir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "test-workdir")
	ctx := AgentContext{AgentName: "test-agent"}
	if err := Prepare(dir, ctx); err != nil {
		t.Fatalf("Prepare failed: %v", err)
	}
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		t.Fatal("workdir was not created")
	}
}

func TestPrepare_WritesAgentsMd(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "test-workdir")
	ctx := AgentContext{
		AgentName:    "test-agent",
		Instructions: "do something useful",
	}
	if err := Prepare(dir, ctx); err != nil {
		t.Fatalf("Prepare failed: %v", err)
	}
	data, err := os.ReadFile(filepath.Join(dir, "AGENTS.md"))
	if err != nil {
		t.Fatalf("failed to read AGENTS.md: %v", err)
	}
	content := string(data)
	if !containsSubstring(content, "test-agent") {
		t.Error("AGENTS.md should contain agent name")
	}
	if !containsSubstring(content, "do something useful") {
		t.Error("AGENTS.md should contain instructions")
	}
}

func TestPrepare_WritesSkillFiles(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "test-workdir")
	ctx := AgentContext{
		AgentName: "test-agent",
		Skills: []SkillData{
			{
				Name:    "coding",
				Content: "write clean code",
				Files: []SkillFile{
					{Path: "src/main.py", Content: "print('hello')"},
					{Path: "README.txt", Content: "skill readme"},
				},
			},
		},
	}
	if err := Prepare(dir, ctx); err != nil {
		t.Fatalf("Prepare failed: %v", err)
	}
	mainPy := filepath.Join(dir, "skills", "coding", "src", "main.py")
	data, err := os.ReadFile(mainPy)
	if err != nil {
		t.Fatalf("failed to read skill file: %v", err)
	}
	if string(data) != "print('hello')" {
		t.Errorf("expected print('hello'), got %s", data)
	}
	readme := filepath.Join(dir, "skills", "coding", "README.txt")
	data2, err := os.ReadFile(readme)
	if err != nil {
		t.Fatalf("failed to read skill readme: %v", err)
	}
	if string(data2) != "skill readme" {
		t.Errorf("expected 'skill readme', got %s", data2)
	}
}

func TestPrepare_PathTraversalProtection(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "test-workdir")
	_ = AgentContext{AgentName: "test-agent"}
	cleaned := filepath.Join(dir, "AGENTS.md")
	if filepath.IsAbs(cleaned) && containsSubstring(cleaned, "..") {
		t.Error("path should not contain traversal")
	}
}

func TestCleanup_RemovesWorkdir(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "to-cleanup")
	os.MkdirAll(dir, 0o755)
	os.WriteFile(filepath.Join(dir, "test.txt"), []byte("data"), 0o644)
	if err := Cleanup(dir); err != nil {
		t.Fatalf("Cleanup failed: %v", err)
	}
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Error("workdir should be removed after Cleanup")
	}
}

func TestCleanup_EmptyPath(t *testing.T) {
	if err := Cleanup(""); err != nil {
		t.Errorf("Cleanup with empty path should not error, got: %v", err)
	}
}

func TestCleanup_PathTraversal(t *testing.T) {
	if err := Cleanup("/tmp/../etc"); err == nil {
		t.Error("Cleanup should reject path traversal")
	}
}

func TestAgentContext_JSONSerialization(t *testing.T) {
	ctx := AgentContext{
		AgentName:    "test",
		Instructions: "instructions",
		IssueContext: "issue context",
		Skills: []SkillData{
			{Name: "skill1", Content: "content1"},
		},
	}
	data, err := json.Marshal(ctx)
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}
	content := string(data)
	if !containsSubstring(content, "test") {
		t.Errorf("serialized data should contain agent name, got: %s", content)
	}
	if !containsSubstring(content, "instructions") {
		t.Errorf("serialized data should contain instructions, got: %s", content)
	}
	if !containsSubstring(content, "skill1") {
		t.Errorf("serialized data should contain skill name, got: %s", content)
	}
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
