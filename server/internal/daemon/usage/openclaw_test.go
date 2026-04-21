package usage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestOpenClawScannerName(t *testing.T) {
	s := &openclawScanner{}
	if s.Name() != "openclaw" {
		t.Errorf("Name() = %s, want openclaw", s.Name())
	}
}

func TestParseOpenClawFile(t *testing.T) {
	dir := t.TempDir()
	sessionsDir := filepath.Join(dir, "test-agent", "sessions")
	os.MkdirAll(sessionsDir, 0o755)

	content := `{"type":"message","timestamp":"2024-01-15T10:00:00Z","message":{"role":"assistant","provider":"anthropic","model":"claude-3","usage":{"input":100,"output":50,"cacheRead":10,"cacheWrite":5}}}
{"type":"message","timestamp":"2024-01-15T10:01:00Z","message":{"role":"user","content":"hello"}}
`
	path := filepath.Join(sessionsDir, "test.jsonl")
	os.WriteFile(path, []byte(content), 0o644)

	records := parseOpenClawFile(path)
	if len(records) != 1 {
		t.Fatalf("parseOpenClawFile() returned %d records, want 1", len(records))
	}
	r := records[0]
	if r.Provider != "openclaw" {
		t.Errorf("Provider = %s, want openclaw", r.Provider)
	}
	if r.InputTokens != 100 {
		t.Errorf("InputTokens = %d, want 100", r.InputTokens)
	}
	if r.OutputTokens != 50 {
		t.Errorf("OutputTokens = %d, want 50", r.OutputTokens)
	}
}

func TestNormalizeOpenClawModel(t *testing.T) {
	tests := []struct {
		provider, model, want string
	}{
		{"anthropic", "claude-3", "anthropic/claude-3"},
		{"", "gpt-4", "gpt-4"},
		{"openai", "gpt-4", "openai/gpt-4"},
		{"", "org/model", "org/model"},
	}
	for _, tt := range tests {
		got := normalizeOpenClawModel(tt.provider, tt.model)
		if got != tt.want {
			t.Errorf("normalizeOpenClawModel(%s, %s) = %s, want %s", tt.provider, tt.model, got, tt.want)
		}
	}
}
