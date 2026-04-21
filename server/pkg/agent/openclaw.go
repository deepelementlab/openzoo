package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"time"
)

type openClawBackend struct {
	cfg Config
}

func newOpenClawBackend(cfg Config) *openClawBackend {
	return &openClawBackend{cfg: cfg}
}

func (b *openClawBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "openclaw"
	}
	if _, err := exec.LookPath(execPath); err != nil {
		return nil, fmt.Errorf("openclaw executable not found at %q: %w", execPath, err)
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
	args := []string{"agent", "--local", "--json", "--session-id", sessionID}
	if opts.Timeout > 0 {
		args = append(args, "--timeout", fmt.Sprintf("%d", int(opts.Timeout.Seconds())))
	}
	args = append(args, "--message", prompt)

	cmd := exec.CommandContext(runCtx, execPath, args...)
	if opts.Cwd != "" {
		cmd.Dir = opts.Cwd
	}
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)

	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("openclaw stderr pipe: %w", err)
	}
	cmd.Stdout = newLogWriter(b.cfg.Logger, "[openclaw:stdout] ")

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("start openclaw: %w", err)
	}

	b.cfg.Logger.Info("openclaw started", "pid", cmd.Process.Pid, "cwd", opts.Cwd, "model", opts.Model)

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)

	go func() {
		defer cancel()
		defer close(msgCh)
		defer close(resCh)

		startTime := time.Now()
		scanResult := b.processOutput(stderr, msgCh)

		exitErr := cmd.Wait()
		duration := time.Since(startTime)

		if runCtx.Err() == context.DeadlineExceeded {
			scanResult.status = "timeout"
			scanResult.errMsg = fmt.Sprintf("openclaw timed out after %s", timeout)
		} else if runCtx.Err() == context.Canceled {
			scanResult.status = "aborted"
			scanResult.errMsg = "execution cancelled"
		} else if exitErr != nil && scanResult.status == "completed" {
			scanResult.status = "failed"
			scanResult.errMsg = fmt.Sprintf("openclaw exited with error: %v", exitErr)
		}

		b.cfg.Logger.Info("openclaw finished", "pid", cmd.Process.Pid, "status", scanResult.status, "duration", duration.Round(time.Millisecond).String())

		var usage map[string]TokenUsage
		u := scanResult.usage
		if u.InputTokens > 0 || u.OutputTokens > 0 || u.CacheReadTokens > 0 || u.CacheWriteTokens > 0 {
			model := opts.Model
			if model == "" {
				model = "unknown"
			}
			usage = map[string]TokenUsage{model: u}
		}

		resCh <- Result{
			Status:     scanResult.status,
			Output:     scanResult.output,
			Error:      scanResult.errMsg,
			Provider:   "openclaw",
			DurationMs: duration.Milliseconds(),
			SessionID:  scanResult.sessionID,
			Usage:      usage,
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}

type openClawEventResult struct {
	status    string
	errMsg    string
	output    string
	sessionID string
	usage     TokenUsage
}

func (b *openClawBackend) processOutput(r io.Reader, ch chan<- Message) openClawEventResult {
	data, err := io.ReadAll(r)
	if err != nil {
		return openClawEventResult{status: "failed", errMsg: fmt.Sprintf("read stderr: %v", err)}
	}

	raw := string(data)

	var result openClawResult
	jsonStart := -1
	for i := 0; i < len(raw); i++ {
		if raw[i] != '{' {
			continue
		}
		if err := json.Unmarshal([]byte(raw[i:]), &result); err == nil && result.Payloads != nil {
			jsonStart = i
			break
		}
	}

	if jsonStart > 0 {
		for _, line := range strings.Split(raw[:jsonStart], "\n") {
			line = strings.TrimSpace(line)
			if line != "" {
				b.cfg.Logger.Debug("[openclaw:stderr] " + line)
			}
		}
	}

	if jsonStart < 0 {
		trimmed := strings.TrimSpace(raw)
		if trimmed != "" {
			b.cfg.Logger.Debug("[openclaw:stderr] " + trimmed)
			return openClawEventResult{status: "completed", output: trimmed}
		}
		return openClawEventResult{status: "failed", errMsg: "openclaw returned no parseable output"}
	}

	var output strings.Builder
	for _, p := range result.Payloads {
		if p.Text != "" {
			if output.Len() > 0 {
				output.WriteString("\n")
			}
			output.WriteString(p.Text)
		}
	}

	var sessionID string
	var usage TokenUsage
	if result.Meta.AgentMeta != nil {
		if sid, ok := result.Meta.AgentMeta["sessionId"].(string); ok {
			sessionID = sid
		}
		if u, ok := result.Meta.AgentMeta["usage"].(map[string]any); ok {
			usage.InputTokens = openClawInt64(u, "input")
			usage.OutputTokens = openClawInt64(u, "output")
			usage.CacheReadTokens = openClawInt64(u, "cacheRead")
			usage.CacheWriteTokens = openClawInt64(u, "cacheWrite")
		}
	}

	if output.Len() > 0 {
		trySend(ch, Message{Type: MessageText, Content: output.String()})
	}

	return openClawEventResult{
		status:    "completed",
		output:    output.String(),
		sessionID: sessionID,
		usage:     usage,
	}
}

func openClawInt64(data map[string]any, key string) int64 {
	v, ok := data[key]
	if !ok {
		return 0
	}
	switch n := v.(type) {
	case float64:
		return int64(n)
	case int64:
		return n
	default:
		return 0
	}
}

type openClawResult struct {
	Payloads []openclawPayload `json:"payloads"`
	Meta     openclawMeta      `json:"meta"`
}

type openclawPayload struct {
	Text string `json:"text"`
}

type openclawMeta struct {
	DurationMs int64          `json:"durationMs"`
	AgentMeta  map[string]any `json:"agentMeta"`
}
