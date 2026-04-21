package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

type externalAttachBackend struct {
	cfg       Config
	sessionID string
}

func newExternalAttachBackend(cfg Config) *externalAttachBackend {
	return &externalAttachBackend{cfg: cfg}
}

func (b *externalAttachBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	if b.sessionID == "" {
		return nil, fmt.Errorf("external-attach: session_id is required")
	}

	if opts.Timeout == 0 {
		opts.Timeout = 30 * time.Minute
	}
	ctx, cancel := context.WithTimeout(ctx, opts.Timeout)

	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "claude"
	}

	args := []string{
		"--resume", b.sessionID,
		"--output-format", "stream-json",
		"--input-format", "stream-json",
		"--verbose",
		"--permission-mode", "bypassPermissions",
	}
	if opts.Model != "" {
		args = append(args, "--model", opts.Model)
	}
	args = append(args, "-p")

	cmd := exec.CommandContext(ctx, execPath, args...)
	if opts.Cwd != "" {
		cmd.Dir = opts.Cwd
	}
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("external-attach stdin pipe: %w", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("external-attach stdout pipe: %w", err)
	}
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[external-attach:stderr] ")

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("external-attach start: %w", err)
	}

	b.cfg.Logger.Info("external-attach started",
		"pid", cmd.Process.Pid,
		"session_id", b.sessionID,
		"cwd", opts.Cwd)

	if prompt != "" {
		if err := writeClaudeInput(stdin, prompt); err != nil {
			_ = stdin.Close()
			cancel()
			_ = cmd.Wait()
			return nil, fmt.Errorf("external-attach write input: %w", err)
		}
	}
	_ = stdin.Close()

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)

	go func() {
		defer close(msgCh)
		defer cancel()
		startTime := time.Now()
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

		for scanner.Scan() {
			line := scanner.Text()
			if strings.TrimSpace(line) == "" {
				continue
			}
			var evt map[string]interface{}
			if err := json.Unmarshal([]byte(line), &evt); err != nil {
				continue
			}
			msgType, _ := evt["type"].(string)
			switch msgType {
			case "assistant":
				msg, _ := evt["message"].(map[string]interface{})
				if msg == nil {
					continue
				}
				if content, ok := msg["content"].([]interface{}); ok {
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
				}
			case "user":
				msg, _ := evt["message"].(map[string]interface{})
				if msg != nil {
					if content, ok := msg["content"].([]interface{}); ok {
						for _, c := range content {
							block, _ := c.(map[string]interface{})
							blockType, _ := block["type"].(string)
							if blockType == "tool_result" {
								toolUseID, _ := block["tool_use_id"].(string)
								output, _ := block["content"].(string)
								if output == "" {
									output, _ = block["output"].(string)
								}
								trySend(msgCh, Message{Type: MessageToolResult, CallID: toolUseID, Output: output})
							}
						}
					}
				}
			case "result":
				resultStr, _ := evt["result"].(string)
				if resultStr == "" {
					resultStr = "Task completed"
				}
				sessionID, _ := evt["session_id"].(string)
				usage := parseTokenUsage(evt["usage"])
				resCh <- Result{
					Status:     "completed",
					Output:     resultStr,
					Provider:   "external-attach",
					DurationMs: time.Since(startTime).Milliseconds(),
					SessionID:  sessionID,
					Usage:      usage,
				}
				return
			case "error":
				errMsg, _ := evt["error"].(string)
				if errMsg == "" {
					if e, ok := evt["error"].(map[string]interface{}); ok {
						errMsg, _ = e["message"].(string)
					}
				}
				resCh <- Result{
					Status:     "failed",
					Error:      errMsg,
					Provider:   "external-attach",
					DurationMs: time.Since(startTime).Milliseconds(),
				}
				return
			}
		}

		if err := cmd.Wait(); err != nil {
			if ctx.Err() == context.DeadlineExceeded {
				resCh <- Result{Status: "timeout", Error: "execution timed out", Provider: "external-attach", DurationMs: time.Since(startTime).Milliseconds()}
			} else {
				resCh <- Result{Status: "failed", Error: err.Error(), Provider: "external-attach", DurationMs: time.Since(startTime).Milliseconds()}
			}
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

func (b *externalAttachBackend) SetSessionID(id string) {
	b.sessionID = id
}

var _ Backend = (*externalAttachBackend)(nil)
