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

type stormClawBackend struct {
	cfg Config
}

func newStormClawBackend(cfg Config) *stormClawBackend {
	return &stormClawBackend{cfg: cfg}
}

func (b *stormClawBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "stormclaw"
	}
	if _, err := exec.LookPath(execPath); err != nil {
		return nil, fmt.Errorf("stormclaw executable not found at %q: %w", execPath, err)
	}

	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 20 * time.Minute
	}
	runCtx, cancel := context.WithTimeout(ctx, timeout)

	sessionID := opts.ResumeSessionID
	if sessionID == "" {
		sessionID = fmt.Sprintf("openzoo-%d", time.Now().UnixNano())
	}

	args := []string{"agent", "-m", prompt, "-s", sessionID, "--no-stream"}
	cmd := exec.CommandContext(runCtx, execPath, args...)
	if opts.Cwd != "" {
		cmd.Dir = opts.Cwd
	}
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[stormclaw:stderr] ")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("stormclaw stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("start stormclaw: %w", err)
	}

	b.cfg.Logger.Info("stormclaw started", "pid", cmd.Process.Pid, "cwd", opts.Cwd, "session", sessionID)

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)

	go func() {
		defer cancel()
		defer close(msgCh)
		defer close(resCh)

		startTime := time.Now()
		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
		var output strings.Builder

		for scanner.Scan() {
			line := scanner.Text()
			if strings.TrimSpace(line) == "" {
				continue
			}

			var evt map[string]any
			if err := json.Unmarshal([]byte(line), &evt); err == nil {
				msgType, _ := evt["type"].(string)
				switch msgType {
				case "message", "text", "response":
					content, _ := evt["content"].(string)
					if content == "" {
						content, _ = evt["text"].(string)
					}
					if content == "" {
						content, _ = evt["response"].(string)
					}
					if content != "" {
						trySend(msgCh, Message{Type: MessageText, Content: content})
						output.WriteString(content)
						output.WriteString("\n")
					}
				case "tool_call":
					toolName, _ := evt["name"].(string)
					callID, _ := evt["id"].(string)
					input, _ := evt["arguments"].(map[string]any)
					trySend(msgCh, Message{Type: MessageToolUse, Tool: toolName, CallID: callID, Input: input})
				case "tool_result", "tool_output":
					callID, _ := evt["call_id"].(string)
					if callID == "" {
						callID, _ = evt["id"].(string)
					}
					outputStr, _ := evt["output"].(string)
					trySend(msgCh, Message{Type: MessageToolResult, CallID: callID, Output: outputStr})
				case "error":
					errMsg, _ := evt["error"].(string)
					if errMsg == "" {
						errMsg, _ = evt["message"].(string)
					}
					trySend(msgCh, Message{Type: MessageError, Content: errMsg})
				case "usage":
					if usage := parseStormClawUsage(evt); usage != nil {
						b.cfg.Logger.Debug("stormclaw usage", "input", usage.InputTokens, "output", usage.OutputTokens)
					}
				default:
					output.WriteString(line)
					output.WriteString("\n")
				}
				continue
			}

			trySend(msgCh, Message{Type: MessageText, Content: line})
			output.WriteString(line)
			output.WriteString("\n")
		}

		exitErr := cmd.Wait()
		duration := time.Since(startTime)

		status := "completed"
		var errMsg string
		if runCtx.Err() == context.DeadlineExceeded {
			status = "timeout"
			errMsg = fmt.Sprintf("stormclaw timed out after %s", timeout)
		} else if runCtx.Err() == context.Canceled {
			status = "aborted"
			errMsg = "execution cancelled"
		} else if exitErr != nil && output.Len() == 0 {
			status = "failed"
			errMsg = fmt.Sprintf("stormclaw exited with error: %v", exitErr)
		}

		b.cfg.Logger.Info("stormclaw finished", "pid", cmd.Process.Pid, "status", status, "duration", duration.Round(time.Millisecond).String())

		resCh <- Result{
			Status:     status,
			Output:     strings.TrimSpace(output.String()),
			Error:      errMsg,
			Provider:   "stormclaw",
			DurationMs: duration.Milliseconds(),
			SessionID:  sessionID,
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

func parseStormClawUsage(evt map[string]any) *TokenUsage {
	input, _ := evt["input_tokens"].(float64)
	output, _ := evt["output_tokens"].(float64)
	cacheRead, _ := evt["cache_read_tokens"].(float64)
	cacheWrite, _ := evt["cache_write_tokens"].(float64)
	if input == 0 && output == 0 {
		return nil
	}
	return &TokenUsage{
		InputTokens:      int64(input),
		OutputTokens:     int64(output),
		CacheReadTokens:  int64(cacheRead),
		CacheWriteTokens: int64(cacheWrite),
	}
}
