package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/openzoo-ai/openzoo/server/internal/daemon/discovery"
)

type externalMonitorBackend struct {
	cfg         Config
	sessionPath string
	sessionID   string
}

func newExternalMonitorBackend(cfg Config) *externalMonitorBackend {
	return &externalMonitorBackend{cfg: cfg}
}

func (b *externalMonitorBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	sessionPath := b.sessionPath
	if sessionPath == "" {
		sessionPath = opts.Cwd
	}
	if sessionPath == "" {
		return nil, fmt.Errorf("external-monitor: no session file path provided")
	}

	if _, err := os.Stat(sessionPath); err != nil {
		return nil, fmt.Errorf("external-monitor: session file not found: %s", sessionPath)
	}

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)
	ctx, cancel := context.WithCancel(ctx)

	go func() {
		defer close(msgCh)
		defer cancel()

		startTime := time.Now()

		eventCh, err := discovery.WatchSessionFile(ctx, sessionPath)
		if err != nil {
			resCh <- Result{
				Status:     "failed",
				Error:      fmt.Sprintf("watch session file: %v", err),
				Provider:   "external-monitor",
				DurationMs: time.Since(startTime).Milliseconds(),
			}
			return
		}

		f, err := os.Open(sessionPath)
		if err == nil {
			b.replayHistory(ctx, f, msgCh)
			f.Close()
		}

		for {
			select {
			case <-ctx.Done():
				resCh <- Result{
					Status:     "completed",
					Output:     "monitoring ended",
					Provider:   "external-monitor",
					DurationMs: time.Since(startTime).Milliseconds(),
					SessionID:  b.sessionID,
				}
				return
			case evt, ok := <-eventCh:
				if !ok {
					resCh <- Result{
						Status:     "completed",
						Output:     "session file ended",
						Provider:   "external-monitor",
						DurationMs: time.Since(startTime).Milliseconds(),
						SessionID:  b.sessionID,
					}
					return
				}
				if evt.Type == "line" {
					b.parseAndSend(ctx, evt.Line, msgCh)
				}
			}
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

func (b *externalMonitorBackend) replayHistory(ctx context.Context, f *os.File, msgCh chan<- Message) {
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
		}
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		b.parseAndSend(ctx, line, msgCh)
	}
}

func (b *externalMonitorBackend) parseAndSend(ctx context.Context, line string, msgCh chan<- Message) {
	var evt map[string]interface{}
	if err := json.Unmarshal([]byte(line), &evt); err != nil {
		return
	}

	msgType, _ := evt["type"].(string)
	switch msgType {
	case "assistant":
		msg, _ := evt["message"].(map[string]interface{})
		if msg == nil {
			return
		}
		content, ok := msg["content"].([]interface{})
		if !ok {
			return
		}
		for _, c := range content {
			block, _ := c.(map[string]interface{})
			blockType, _ := block["type"].(string)
			switch blockType {
			case "text":
				text, _ := block["text"].(string)
				if text != "" {
					trySend(msgCh, Message{Type: MessageText, Content: text})
				}
			case "thinking":
				thinking, _ := block["thinking"].(string)
				if thinking != "" {
					trySend(msgCh, Message{Type: MessageThinking, Content: thinking})
				}
			case "tool_use":
				toolName, _ := block["name"].(string)
				callID, _ := block["id"].(string)
				input, _ := block["input"].(map[string]any)
				trySend(msgCh, Message{Type: MessageToolUse, Tool: toolName, CallID: callID, Input: input})
			}
		}
	case "result":
		resultStr, _ := evt["result"].(string)
		if resultStr == "" {
			resultStr = "Task completed"
		}
		trySend(msgCh, Message{Type: MessageText, Content: resultStr, Status: "completed"})
	}
}

func (b *externalMonitorBackend) SetSessionPath(path string) {
	b.sessionPath = path
}

func (b *externalMonitorBackend) SetSessionID(id string) {
	b.sessionID = id
}

var _ Backend = (*externalMonitorBackend)(nil)

type nopLogger struct{}

func (nopLogger) Debug(msg string, args ...any)   {}
func (nopLogger) Info(msg string, args ...any)    {}
func (nopLogger) Warn(msg string, args ...any)    {}
func (nopLogger) Error(msg string, args ...any)   {}

func newSlogLogger(cfg Config) *slog.Logger {
	if cfg.Logger != nil {
		return cfg.Logger
	}
	return slog.Default()
}
