package agent

import (
	"context"
	"strings"
	"testing"
	"time"
)

func TestNewBackend_Hermes(t *testing.T) {
	b, err := New("hermes", Config{Logger: testLogger(t)})
	if err != nil {
		t.Fatalf("New(hermes): %v", err)
	}
	if _, ok := b.(*hermesBackend); !ok {
		t.Fatal("expected *hermesBackend")
	}
}

func TestNewBackend_OpenClaw(t *testing.T) {
	b, err := New("openclaw", Config{Logger: testLogger(t)})
	if err != nil {
		t.Fatalf("New(openclaw): %v", err)
	}
	if _, ok := b.(*openClawBackend); !ok {
		t.Fatal("expected *openClawBackend")
	}
}

func TestNewBackend_Unsupported(t *testing.T) {
	_, err := New("unknown", Config{Logger: testLogger(t)})
	if err == nil {
		t.Fatal("expected error for unknown provider")
	}
	if !strings.Contains(err.Error(), "unsupported provider") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestNewBackend_AllProviders(t *testing.T) {
	for _, p := range []string{"claude", "codex", "opencode", "hermes", "openclaw"} {
		_, err := New(p, Config{Logger: testLogger(t)})
		if err != nil {
			t.Errorf("New(%s): %v", p, err)
		}
	}
}

func TestHermesToolNameFromTitle(t *testing.T) {
	tests := []struct {
		title, kind, want string
	}{
		{"execute code", "", "execute_code"},
		{"terminal: run make test", "execute", "terminal"},
		{"read: src/main.go", "read", "read_file"},
		{"write: src/main.go", "edit", "write_file"},
		{"search: pattern", "search", "search_files"},
		{"patch: fix typo", "", "patch"},
		{"web search: golang testing", "fetch", "web_search"},
		{"delegate: subtask", "", "delegate_task"},
		{"analyze image: screenshot", "", "vision_analyze"},
		{"unknown title", "", ""},
		{"", "execute", "terminal"},
		{"", "edit", "write_file"},
		{"", "read", "read_file"},
		{"", "search", "search_files"},
		{"", "fetch", "web_search"},
		{"", "think", "thinking"},
	}
	for _, tt := range tests {
		got := hermesToolNameFromTitle(tt.title, tt.kind)
		if got != tt.want {
			t.Errorf("hermesToolNameFromTitle(%q, %q) = %q, want %q", tt.title, tt.kind, got, tt.want)
		}
	}
}

func TestHermesSession_Cancel(t *testing.T) {
	msgCh := make(chan Message, 1)
	resCh := make(chan Result, 1)
	ctx, cancel := context.WithCancel(context.Background())
	s := &Session{Messages: msgCh, Result: resCh, cancel: cancel}
	s.Cancel()
	if ctx.Err() == nil {
		t.Fatal("expected context to be cancelled")
	}
	_ = msgCh
	_ = resCh
}

func TestOpenClawInt64(t *testing.T) {
	tests := []struct {
		data map[string]any
		key  string
		want int64
	}{
		{map[string]any{"input": float64(100)}, "input", 100},
		{map[string]any{"input": int64(200)}, "input", 200},
		{map[string]any{"input": "not a number"}, "input", 0},
		{map[string]any{"other": 42}, "input", 0},
		{nil, "input", 0},
	}
	for _, tt := range tests {
		got := openClawInt64(tt.data, tt.key)
		if got != tt.want {
			t.Errorf("openClawInt64(%v, %q) = %d, want %d", tt.data, tt.key, got, tt.want)
		}
	}
}

func TestParseTokenUsage(t *testing.T) {
	raw := map[string]any{
		"model-a": map[string]any{
			"input_tokens":                float64(100),
			"output_tokens":               float64(50),
			"cache_read_input_tokens":     float64(30),
			"cache_creation_input_tokens": float64(10),
		},
	}
	result := parseTokenUsage(raw)
	u, ok := result["model-a"]
	if !ok {
		t.Fatal("expected model-a entry")
	}
	if u.InputTokens != 100 {
		t.Errorf("InputTokens = %d, want 100", u.InputTokens)
	}
	if u.OutputTokens != 50 {
		t.Errorf("OutputTokens = %d, want 50", u.OutputTokens)
	}
	if u.CacheReadTokens != 30 {
		t.Errorf("CacheReadTokens = %d, want 30", u.CacheReadTokens)
	}
	if u.CacheWriteTokens != 10 {
		t.Errorf("CacheWriteTokens = %d, want 10", u.CacheWriteTokens)
	}
}

func TestBuildEnv(t *testing.T) {
	env := buildEnv(
		map[string]string{"CUSTOM": "val"},
		map[string]string{"EXTRA": "val2"},
	)
	found := map[string]bool{}
	for _, e := range env {
		if strings.HasPrefix(e, "CUSTOM=") {
			found["CUSTOM"] = true
		}
		if strings.HasPrefix(e, "EXTRA=") {
			found["EXTRA"] = true
		}
		if strings.HasPrefix(e, "PATH=") {
			found["PATH"] = true
		}
	}
	if !found["CUSTOM"] || !found["EXTRA"] || !found["PATH"] {
		t.Fatalf("expected CUSTOM, EXTRA, PATH in env, got %v", found)
	}
}

func TestIsFilteredEnvKey(t *testing.T) {
	tests := []struct {
		key  string
		want bool
	}{
		{"CLAUDECODE", true},
		{"CLAUDECODE_HOME", true},
		{"CLAUDE_CODE_CONFIG", true},
		{"PATH", false},
		{"HOME", false},
		{"GITHUB_TOKEN", false},
	}
	for _, tt := range tests {
		got := isFilteredEnvKey(tt.key)
		if got != tt.want {
			t.Errorf("isFilteredEnvKey(%q) = %v, want %v", tt.key, got, tt.want)
		}
	}
}

func TestTrySend(t *testing.T) {
	ch := make(chan Message, 1)
	trySend(ch, Message{Type: MessageText, Content: "hello"})
	msg := <-ch
	if msg.Content != "hello" {
		t.Fatalf("expected hello, got %s", msg.Content)
	}
}

func TestTrySend_Full(t *testing.T) {
	ch := make(chan Message, 1)
	trySend(ch, Message{Type: MessageText, Content: "first"})
	trySend(ch, Message{Type: MessageText, Content: "second"})
	if len(ch) != 1 {
		t.Fatalf("expected 1 message in channel, got %d", len(ch))
	}
}

func TestDetectVersion_Invalid(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, err := DetectVersion(ctx, "/nonexistent/binary")
	if err == nil {
		t.Fatal("expected error for nonexistent binary")
	}
}

func TestLogWriter(t *testing.T) {
	lw := newLogWriter(testLogger(t), "[test] ")
	n, err := lw.Write([]byte("hello\n"))
	if err != nil {
		t.Fatal(err)
	}
	if n != 6 {
		t.Errorf("wrote %d bytes, want 6", n)
	}
}
