package agent

import (
	"context"
	"fmt"
	"log/slog"
	"time"
)

type MessageType string

const (
	MessageText       MessageType = "text"
	MessageThinking   MessageType = "thinking"
	MessageToolUse    MessageType = "tool-use"
	MessageToolResult MessageType = "tool-result"
	MessageError      MessageType = "error"
	MessageStatus     MessageType = "status"
	MessageLog        MessageType = "log"
)

type Message struct {
	Type    MessageType `json:"type"`
	Content string      `json:"content,omitempty"`
	Tool    string      `json:"tool,omitempty"`
	CallID  string      `json:"call_id,omitempty"`
	Input   map[string]any `json:"input,omitempty"`
	Output  string      `json:"output,omitempty"`
	Status  string      `json:"status,omitempty"`
	Level   string      `json:"level,omitempty"`
}

type TokenUsage struct {
	InputTokens      int64 `json:"input_tokens"`
	OutputTokens     int64 `json:"output_tokens"`
	CacheReadTokens  int64 `json:"cache_read_tokens"`
	CacheWriteTokens int64 `json:"cache_write_tokens"`
}

type ExecOptions struct {
	Cwd             string
	Model           string
	SystemPrompt    string
	MaxTurns        int
	Timeout         time.Duration
	ResumeSessionID string
	Env             map[string]string
}

type Session struct {
	Messages <-chan Message
	Result   <-chan Result
	cancel   context.CancelFunc
}

func (s *Session) Cancel() {
	if s.cancel != nil {
		s.cancel()
	}
}

type Result struct {
	Status     string               `json:"status"`
	Output     string               `json:"output"`
	Error      string               `json:"error,omitempty"`
	Provider   string               `json:"provider"`
	DurationMs int64                `json:"duration_ms"`
	SessionID  string               `json:"session_id,omitempty"`
	Usage      map[string]TokenUsage `json:"usage,omitempty"`
}

type Config struct {
	ExecutablePath string
	Env            map[string]string
	Logger         *slog.Logger
}

type Backend interface {
	Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error)
}

func New(provider string, cfg Config) (Backend, error) {
	if cfg.Logger == nil {
		cfg.Logger = slog.Default()
	}
	switch provider {
	case "claude":
		return newClaudeBackend(cfg), nil
	case "codex":
		return newCodexBackend(cfg), nil
	case "opencode":
		return newOpenCodeBackend(cfg), nil
	case "hermes":
		return newHermesBackend(cfg), nil
	case "openclaw":
		return newOpenClawBackend(cfg), nil
	case "clawcode":
		return newClawCodeBackend(cfg), nil
	case "stormclaw":
		return newStormClawBackend(cfg), nil
	case "external-monitor":
		return newExternalMonitorBackend(cfg), nil
	case "external-attach":
		return newExternalAttachBackend(cfg), nil
	default:
		return nil, fmt.Errorf("unsupported provider: %s (supported: claude, codex, opencode, hermes, openclaw, clawcode, stormclaw, external-monitor, external-attach)", provider)
	}
}

func DetectVersion(ctx context.Context, executablePath string) (string, error) {
	return detectCLIVersion(ctx, executablePath)
}
