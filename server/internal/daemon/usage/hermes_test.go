package usage

import (
	"os"
	"path/filepath"
	"testing"
)

func TestHermesScannerName(t *testing.T) {
	s := &hermesScanner{}
	if s.Name() != "hermes" {
		t.Errorf("Name() = %s, want hermes", s.Name())
	}
}

func TestParseHermesFile(t *testing.T) {
	dir := t.TempDir()
	content := `{"type":"usage_update","timestamp":"2024-01-15T10:00:00Z","model":"gpt-4","usage":{"inputTokens":200,"outputTokens":100,"cachedReadTokens":20,"thoughtTokens":30}}
{"type":"usage_update","timestamp":"2024-01-15T10:05:00Z","model":"gpt-4","usage":{"inputTokens":500,"outputTokens":300,"cachedReadTokens":50,"thoughtTokens":80}}
`
	path := filepath.Join(dir, "session-1.jsonl")
	os.WriteFile(path, []byte(content), 0o644)

	record := parseHermesFile(path)
	if record == nil {
		t.Fatal("parseHermesFile() returned nil")
	}
	if record.Provider != "hermes" {
		t.Errorf("Provider = %s, want hermes", record.Provider)
	}
	if record.InputTokens != 500 {
		t.Errorf("InputTokens = %d, want 500 (last cumulative)", record.InputTokens)
	}
	expectedOutput := int64(300 + 80)
	if record.OutputTokens != expectedOutput {
		t.Errorf("OutputTokens = %d, want %d (output + thought)", record.OutputTokens, expectedOutput)
	}
	if record.CacheRead != 50 {
		t.Errorf("CacheRead = %d, want 50", record.CacheRead)
	}
}

func TestParseHermesFileEmpty(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "empty.jsonl")
	os.WriteFile(path, []byte(""), 0o644)

	record := parseHermesFile(path)
	if record != nil {
		t.Error("parseHermesFile(empty) should return nil")
	}
}
