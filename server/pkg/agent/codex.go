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

type codexBackend struct {
	cfg Config
}

func newCodexBackend(cfg Config) *codexBackend {
	return &codexBackend{cfg: cfg}
}

func (b *codexBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	if opts.Timeout == 0 {
		opts.Timeout = 2 * time.Hour
	}
	ctx, cancel := context.WithTimeout(ctx, opts.Timeout)
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "codex"
	}

	args := []string{"exec", "--json", prompt}
	if opts.Model != "" {
		args = append(args, "--model", opts.Model)
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, opts.Timeout)
	cmd := exec.CommandContext(timeoutCtx, execPath, args...)
	cmd.Dir = opts.Cwd
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[codex:stderr] ")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("codex stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("codex start: %w", err)
	}

	b.cfg.Logger.Info("codex started", "pid", cmd.Process.Pid, "cwd", opts.Cwd)

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
			case "message":
				content, _ := evt["content"].(string)
				if content != "" {
					trySend(msgCh, Message{Type: MessageText, Content: content})
					output.WriteString(content)
				}
			case "tool_call":
				toolName, _ := evt["name"].(string)
				callID, _ := evt["id"].(string)
				input, _ := evt["arguments"].(map[string]any)
				trySend(msgCh, Message{Type: MessageToolUse, Tool: toolName, CallID: callID, Input: input})
			case "tool_output":
				callID, _ := evt["call_id"].(string)
				outputStr, _ := evt["output"].(string)
				trySend(msgCh, Message{Type: MessageToolResult, CallID: callID, Output: outputStr})
			case "error":
				errMsg, _ := evt["error"].(string)
				resCh <- Result{Status: "failed", Error: errMsg, Provider: "codex", DurationMs: time.Since(startTime).Milliseconds()}
				return
			}
		}

		if err := cmd.Wait(); err != nil {
			if ctx.Err() == context.DeadlineExceeded {
				resCh <- Result{Status: "timeout", Error: "execution timed out", Provider: "codex", DurationMs: time.Since(startTime).Milliseconds()}
			} else {
				resCh <- Result{Status: "completed", Output: output.String(), Provider: "codex", DurationMs: time.Since(startTime).Milliseconds()}
			}
		} else {
			resCh <- Result{Status: "completed", Output: output.String(), Provider: "codex", DurationMs: time.Since(startTime).Milliseconds()}
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}
