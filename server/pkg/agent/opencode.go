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

type openCodeBackend struct {
	cfg Config
}

func newOpenCodeBackend(cfg Config) *openCodeBackend {
	return &openCodeBackend{cfg: cfg}
}

func (b *openCodeBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	if opts.Timeout == 0 {
		opts.Timeout = 2 * time.Hour
	}
	ctx, cancel := context.WithTimeout(ctx, opts.Timeout)
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "opencode"
	}

	args := []string{"run", "--format", "json"}
	if opts.Model != "" {
		args = append(args, "--model", opts.Model)
	}
	if opts.ResumeSessionID != "" {
		args = append(args, "--session", opts.ResumeSessionID)
	}
	args = append(args, prompt)

	timeoutCtx, cancel := context.WithTimeout(ctx, opts.Timeout)
	cmd := exec.CommandContext(timeoutCtx, execPath, args...)
	cmd.Dir = opts.Cwd

	env := buildEnv(b.cfg.Env, opts.Env)
	env = append(env, "OPENCODE_PERMISSION={\"*\":\"allow\"}")
	cmd.Env = env
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[opencode:stderr] ")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("opencode stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("opencode start: %w", err)
	}

	b.cfg.Logger.Info("opencode started", "pid", cmd.Process.Pid, "cwd", opts.Cwd)

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)

	go func() {
		defer close(msgCh)
		defer cancel()
		startTime := time.Now()
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
		var output strings.Builder

		for scanner.Scan() {
			line := scanner.Text()
			if strings.TrimSpace(line) == "" {
				continue
			}
			var evt map[string]interface{}
			if err := json.Unmarshal([]byte(line), &evt); err != nil {
				output.WriteString(line)
				output.WriteString("\n")
				continue
			}
			msgType, _ := evt["type"].(string)
			switch msgType {
			case "text":
				content, _ := evt["content"].(string)
				trySend(msgCh, Message{Type: MessageText, Content: content})
				output.WriteString(content)
			case "thinking":
				content, _ := evt["content"].(string)
				trySend(msgCh, Message{Type: MessageThinking, Content: content})
			case "step_start":
				stepName, _ := evt["name"].(string)
				trySend(msgCh, Message{Type: MessageStatus, Content: stepName})
			case "step_finish":
				usage := parseOpenCodeStepUsage(evt)
				if usage != nil {
					b.cfg.Logger.Debug("opencode step usage", "usage", usage)
				}
			case "tool_use":
				toolName, _ := evt["name"].(string)
				callID, _ := evt["id"].(string)
				input, _ := evt["input"].(map[string]any)
				trySend(msgCh, Message{Type: MessageToolUse, Tool: toolName, CallID: callID, Input: input})
			case "tool_result":
				callID, _ := evt["call_id"].(string)
				out, _ := evt["output"].(string)
				trySend(msgCh, Message{Type: MessageToolResult, CallID: callID, Output: out})
			case "error":
				errMsg, _ := evt["error"].(string)
				resCh <- Result{Status: "failed", Error: errMsg, Provider: "opencode", DurationMs: time.Since(startTime).Milliseconds()}
				return
			case "result":
				content, _ := evt["content"].(string)
				sessionID, _ := evt["session_id"].(string)
				usage := parseTokenUsage(evt["usage"])
				resCh <- Result{
					Status: "completed", Output: content, Provider: "opencode",
					DurationMs: time.Since(startTime).Milliseconds(), SessionID: sessionID, Usage: usage,
				}
				return
			}
		}

		if err := cmd.Wait(); err != nil {
			if ctx.Err() == context.DeadlineExceeded {
				resCh <- Result{Status: "timeout", Error: "timed out", Provider: "opencode", DurationMs: time.Since(startTime).Milliseconds()}
			} else {
				resCh <- Result{Status: "completed", Output: output.String(), Provider: "opencode", DurationMs: time.Since(startTime).Milliseconds()}
			}
		} else {
			resCh <- Result{Status: "completed", Output: output.String(), Provider: "opencode", DurationMs: time.Since(startTime).Milliseconds()}
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

func parseOpenCodeStepUsage(evt map[string]interface{}) map[string]TokenUsage {
	usageRaw, ok := evt["usage"]
	if !ok {
		return nil
	}
	return parseTokenUsage(usageRaw)
}
