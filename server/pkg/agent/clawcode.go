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

type clawCodeBackend struct {
	cfg Config
}

func newClawCodeBackend(cfg Config) *clawCodeBackend {
	return &clawCodeBackend{cfg: cfg}
}

func (b *clawCodeBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 2 * time.Hour
	}
	runCtx, cancel := context.WithTimeout(ctx, timeout)

	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "clawcode"
	}

	args := []string{"-p", prompt, "-f", "json", "--quiet"}
	if opts.Cwd != "" {
		args = append(args, "-c", opts.Cwd)
	}

	cmd := exec.CommandContext(runCtx, execPath, args...)
	if opts.Cwd != "" {
		cmd.Dir = opts.Cwd
	}
	cmd.Env = buildEnv(b.cfg.Env, opts.Env)
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[clawcode:stderr] ")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("clawcode stdout pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("start clawcode: %w", err)
	}

	b.cfg.Logger.Info("clawcode started", "pid", cmd.Process.Pid, "cwd", opts.Cwd)

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
				if errMsg == "" {
					errMsg, _ = evt["message"].(string)
				}
				trySend(msgCh, Message{Type: MessageError, Content: errMsg})
				resCh <- Result{Status: "failed", Error: errMsg, Provider: "clawcode", DurationMs: time.Since(startTime).Milliseconds()}
				return
			case "response":
				content, _ := evt["content"].(string)
				if content != "" {
					trySend(msgCh, Message{Type: MessageText, Content: content})
					output.WriteString(content)
				}
			}
		}

		exitErr := cmd.Wait()
		duration := time.Since(startTime)

		status := "completed"
		var errMsg string
		if runCtx.Err() == context.DeadlineExceeded {
			status = "timeout"
			errMsg = fmt.Sprintf("clawcode timed out after %s", timeout)
		} else if runCtx.Err() == context.Canceled {
			status = "aborted"
			errMsg = "execution cancelled"
		} else if exitErr != nil && output.Len() == 0 {
			status = "failed"
			errMsg = fmt.Sprintf("clawcode exited with error: %v", exitErr)
		}

		if output.Len() == 0 && status == "completed" {
			rawOutput := scanner.Text()
			if rawOutput != "" {
				var jsonResp map[string]any
				if json.Unmarshal([]byte(rawOutput), &jsonResp) == nil {
					if resp, ok := jsonResp["response"].(string); ok {
						output.WriteString(resp)
						trySend(msgCh, Message{Type: MessageText, Content: resp})
					}
				}
			}
		}

		b.cfg.Logger.Info("clawcode finished", "pid", cmd.Process.Pid, "status", status, "duration", duration.Round(time.Millisecond).String())

		resCh <- Result{
			Status:     status,
			Output:     output.String(),
			Error:      errMsg,
			Provider:   "clawcode",
			DurationMs: duration.Milliseconds(),
		}
	}()

	return &Session{Messages: msgCh, Result: resCh, cancel: cancel}, nil
}
