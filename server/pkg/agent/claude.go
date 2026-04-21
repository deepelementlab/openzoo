package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"strings"
	"time"
)

type claudeBackend struct {
	cfg Config
}

func newClaudeBackend(cfg Config) *claudeBackend {
	return &claudeBackend{cfg: cfg}
}

func (b *claudeBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	if opts.Timeout == 0 {
		opts.Timeout = 2 * time.Hour
	}
	ctx, cancel := context.WithTimeout(ctx, opts.Timeout)
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "claude"
	}

	args := []string{
		"--verbose",
		"--output-format", "stream-json",
		"--input-format", "stream-json",
		"--permission-mode", "bypassPermissions",
		"--strict-mcp-config",
	}
	if opts.Model != "" {
		args = append(args, "--model", opts.Model)
	}
	if opts.MaxTurns > 0 {
		args = append(args, "--max-turns", fmt.Sprintf("%d", opts.MaxTurns))
	}
	if opts.SystemPrompt != "" {
		args = append(args, "--append-system-prompt", opts.SystemPrompt)
	}
	if opts.ResumeSessionID != "" {
		args = append(args, "--resume", opts.ResumeSessionID)
	}
	args = append(args, "-p")

	timeoutCtx, cancel := context.WithTimeout(ctx, opts.Timeout)
	cmd := exec.CommandContext(timeoutCtx, execPath, args...)
	cmd.Dir = opts.Cwd
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[claude:stderr] ")

	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("claude stdin pipe: %w", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("claude stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("claude start: %w", err)
	}

	b.cfg.Logger.Info("claude started", "pid", cmd.Process.Pid, "cwd", opts.Cwd)

	if err := writeClaudeInput(stdin, prompt); err != nil {
		cancel()
		return nil, fmt.Errorf("claude write input: %w", err)
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

		var sawAssistant bool
		for scanner.Scan() {
			line := scanner.Text()
			if strings.TrimSpace(line) == "" {
				continue
			}
			var evt map[string]interface{}
			if err := json.Unmarshal([]byte(line), &evt); err != nil {
				b.cfg.Logger.Debug("claude: failed to parse JSON line", "line", line[:min(200, len(line))], "err", err)
				continue
			}
			msgType, _ := evt["type"].(string)
			switch msgType {
			case "system":
				continue
			case "assistant":
				sawAssistant = true
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
					Provider:   "claude",
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
				resCh <- Result{Status: "failed", Error: errMsg, Provider: "claude", DurationMs: time.Since(startTime).Milliseconds()}
				return
			default:
				b.cfg.Logger.Debug("claude: unhandled event type", "type", msgType)
			}
		}
		if !sawAssistant {
			b.cfg.Logger.Warn("claude: no assistant messages received, output format may not be stream-json")
		}
		if err := cmd.Wait(); err != nil {
			if ctx.Err() == context.DeadlineExceeded {
				resCh <- Result{Status: "timeout", Error: "execution timed out", Provider: "claude", DurationMs: time.Since(startTime).Milliseconds()}
			} else {
				resCh <- Result{Status: "failed", Error: err.Error(), Provider: "claude", DurationMs: time.Since(startTime).Milliseconds()}
			}
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

func writeClaudeInput(w io.Writer, prompt string) error {
	data, err := buildClaudeInput(prompt)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

func buildClaudeInput(prompt string) ([]byte, error) {
	payload := map[string]any{
		"type": "user",
		"message": map[string]any{
			"role": "user",
			"content": []map[string]string{
				{"type": "text", "text": prompt},
			},
		},
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal claude input: %w", err)
	}
	return append(data, '\n'), nil
}

func parseTokenUsage(raw interface{}) map[string]TokenUsage {
	result := map[string]TokenUsage{}
	m, ok := raw.(map[string]interface{})
	if !ok {
		return result
	}
	for model, usage := range m {
		u, _ := usage.(map[string]interface{})
		inputTokens, _ := u["input_tokens"].(float64)
		outputTokens, _ := u["output_tokens"].(float64)
		cacheReadTokens, _ := u["cache_read_input_tokens"].(float64)
		cacheWriteTokens, _ := u["cache_creation_input_tokens"].(float64)
		result[model] = TokenUsage{
			InputTokens:      int64(inputTokens),
			OutputTokens:     int64(outputTokens),
			CacheReadTokens:  int64(cacheReadTokens),
			CacheWriteTokens: int64(cacheWriteTokens),
		}
	}
	return result
}

func trySend(ch chan<- Message, msg Message) {
	select {
	case ch <- msg:
	default:
	}
}

func buildEnv(base, extra map[string]string) []string {
	return mergeEnv(os.Environ(), base, extra)
}

func mergeEnv(environ []string, base, extra map[string]string) []string {
	env := make([]string, 0, len(environ)+len(base)+len(extra))
	for _, entry := range environ {
		key, _, _ := strings.Cut(entry, "=")
		if isFilteredEnvKey(key) {
			continue
		}
		env = append(env, entry)
	}
	for k, v := range base {
		env = append(env, k+"="+v)
	}
	for k, v := range extra {
		env = append(env, k+"="+v)
	}
	return env
}

func isFilteredEnvKey(key string) bool {
	return key == "CLAUDECODE" ||
		strings.HasPrefix(key, "CLAUDECODE_") ||
		strings.HasPrefix(key, "CLAUDE_CODE_")
}

func detectCLIVersion(ctx context.Context, execPath string) (string, error) {
	cmd := exec.CommandContext(ctx, execPath, "--version")
	data, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("detect version for %s: %w", execPath, err)
	}
	return strings.TrimSpace(string(data)), nil
}

type logWriter struct {
	logger *slog.Logger
	prefix string
}

func newLogWriter(logger *slog.Logger, prefix string) *logWriter {
	return &logWriter{logger: logger, prefix: prefix}
}

func (w *logWriter) Write(p []byte) (int, error) {
	text := strings.TrimSpace(string(p))
	if text != "" {
		w.logger.Debug(w.prefix + text)
	}
	return len(p), nil
}
