package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/openzoo-ai/openzoo/server/internal/execenv"
	"github.com/openzoo-ai/openzoo/server/pkg/agent"
)

type Daemon struct {
	cfg        *Config
	client     *Client
	runtimes   []Runtime
	logger     *log.Logger
	workspaces map[string]*workspaceState
	mu         sync.RWMutex
}

type workspaceState struct {
	RuntimeIDs map[string]bool
}

func NewDaemon(cfg *Config) *Daemon {
	c := NewClient(cfg.ServerURL)
	c.SetToken(cfg.Token)
	return &Daemon{
		cfg:        cfg,
		client:     c,
		logger:     log.New(os.Stderr, "[daemon] ", log.LstdFlags),
		workspaces: make(map[string]*workspaceState),
	}
}

func (d *Daemon) Run(ctx context.Context) error {
	d.logger.Println("starting daemon")
	daemonStartTime = time.Now()

	d.registerRuntimes(ctx)

	if len(d.runtimes) == 0 {
		return fmt.Errorf("no runtimes registered")
	}

	os.MkdirAll(d.cfg.WorkDir, 0755)

	var wg sync.WaitGroup
	wg.Add(5)
	go func() { defer wg.Done(); d.heartbeatLoop(ctx) }()
	go func() { defer wg.Done(); d.pollLoop(ctx) }()
	go func() { defer wg.Done(); d.configWatchLoop(ctx) }()
	go func() { defer wg.Done(); d.workspaceSyncLoop(ctx) }()
	go func() { defer wg.Done(); d.serveHealth(ctx) }()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-ctx.Done():
	case sig := <-sigCh:
		d.logger.Printf("received signal %v, shutting down", sig)
	}

	d.deregisterRuntimes()
	d.logger.Println("waiting for goroutines to finish...")
	wg.Wait()
	d.logger.Println("daemon stopped")
	return nil
}

func (d *Daemon) registerRuntimes(ctx context.Context) {
	d.mu.Lock()
	defer d.mu.Unlock()

	for _, wsID := range d.cfg.WorkspaceIDs {
		if _, exists := d.workspaces[wsID]; exists {
			continue
		}
		d.workspaces[wsID] = &workspaceState{RuntimeIDs: make(map[string]bool)}
		for provider := range d.cfg.Agents {
			runtimeName := fmt.Sprintf("daemon-%s-%s", provider, wsID[:8])
			runtimeID, err := d.client.RegisterRuntime(ctx, wsID, runtimeName, provider)
			if err != nil {
				d.logger.Printf("failed to register runtime for %s/%s: %v", provider, wsID, err)
				continue
			}
			d.runtimes = append(d.runtimes, Runtime{ID: runtimeID, Name: runtimeName, Provider: provider})
			d.workspaces[wsID].RuntimeIDs[runtimeID] = true
			d.logger.Printf("registered runtime %s (%s) for workspace %s", runtimeID, provider, wsID)
		}
	}
}

func (d *Daemon) deregisterRuntimes() {
	var ids []string
	for _, rt := range d.runtimes {
		ids = append(ids, rt.ID)
	}
	if len(ids) > 0 {
		d.client.Deregister(context.Background(), ids)
	}
	d.logger.Printf("deregistered %d runtimes", len(d.runtimes))
}

func (d *Daemon) configWatchLoop(ctx context.Context) {
	if d.cfg.ConfigPath == "" {
		return
	}
	var lastMod int64
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			mod, ok := ConfigModTime(d.cfg.ConfigPath)
			if !ok || mod == lastMod {
				continue
			}
			lastMod = mod
			newIDs := ParseWorkspaceIDsFromConfig(d.cfg.ConfigPath)
			if newIDs != nil {
				d.mu.Lock()
				d.cfg.WorkspaceIDs = newIDs
				d.mu.Unlock()
				d.registerRuntimes(ctx)
				d.logger.Printf("config hot-reloaded: %d workspaces", len(newIDs))
			}
		}
	}
}

func (d *Daemon) workspaceSyncLoop(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			d.syncWorkspacesFromAPI(ctx)
		}
	}
}

func (d *Daemon) syncWorkspacesFromAPI(ctx context.Context) {
	workspaces, err := d.client.ListWorkspaces(ctx)
	if err != nil {
		return
	}
	d.mu.Lock()
	defer d.mu.Unlock()
	for _, ws := range workspaces {
		if _, exists := d.workspaces[ws.ID]; !exists {
			d.cfg.WorkspaceIDs = append(d.cfg.WorkspaceIDs, ws.ID)
		}
	}
	if len(workspaces) > 0 {
		go d.registerRuntimes(ctx)
	}
}

func (d *Daemon) heartbeatLoop(ctx context.Context) {
	ticker := time.NewTicker(d.cfg.HeartbeatInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			for _, rt := range d.runtimes {
				resp, err := d.client.SendHeartbeat(ctx, rt.ID)
				if err != nil {
					d.logger.Printf("heartbeat failed for %s: %v", rt.ID, err)
					continue
				}
				if resp.PendingPing != nil {
					d.handlePing(ctx, rt.ID, resp.PendingPing)
				}
				if resp.PendingUpdate != nil {
					d.handleUpdate(ctx, rt.ID, resp.PendingUpdate)
				}
			}
		}
	}
}

func (d *Daemon) handlePing(ctx context.Context, runtimeID string, ping *PendingPing) {
	d.logger.Printf("handling ping %s for runtime %s", ping.ID, runtimeID)
	d.client.ReportPingResult(ctx, runtimeID, ping.ID, map[string]any{
		"success": true,
		"latency": 0,
	})
}

func (d *Daemon) handleUpdate(ctx context.Context, runtimeID string, update *PendingUpdate) {
	d.logger.Printf("handling update %s (%s) for runtime %s", update.ID, update.TargetVersion, runtimeID)
	d.client.ReportUpdateResult(ctx, runtimeID, update.ID, map[string]any{
		"success":        false,
		"current_version": "dev",
		"error":          "auto-update not yet supported",
	})
}

func (d *Daemon) pollLoop(ctx context.Context) {
	sem := make(chan struct{}, d.cfg.MaxConcurrentTasks)
	var wg sync.WaitGroup
	pollOffset := 0

	for {
		select {
		case <-ctx.Done():
			d.logger.Println("poll loop stopping")
			done := make(chan struct{})
			go func() { wg.Wait(); close(done) }()
			select {
			case <-done:
			case <-time.After(30 * time.Second):
				d.logger.Println("timed out waiting for in-flight tasks")
			}
			return
		default:
		}

		n := len(d.runtimes)
		if n == 0 {
			sleepWithContext(ctx, d.cfg.PollInterval)
			continue
		}

		claimed := false
		for i := 0; i < n; i++ {
			select {
			case sem <- struct{}{}:
			default:
				goto sleep
			}

			rt := d.runtimes[(pollOffset+i)%n]
			task, err := d.client.ClaimTask(ctx, rt.ID)
			if err != nil {
				<-sem
				d.logger.Printf("claim failed for %s: %v", rt.ID, err)
				continue
			}
			if task != nil {
				task.Provider = rt.Provider
				wg.Add(1)
				go func(t *Task) {
					defer wg.Done()
					defer func() { <-sem }()
					d.handleTask(ctx, t)
				}(task)
				claimed = true
				pollOffset = (pollOffset + i + 1) % n
				break
			}
			<-sem
		}

	sleep:
		if !claimed {
			pollOffset = (pollOffset + 1) % n
			sleepWithContext(ctx, d.cfg.PollInterval)
		}
	}
}

func (d *Daemon) handleTask(ctx context.Context, task *Task) {
	d.logger.Printf("handling task %s (provider=%s)", task.ID, task.Provider)

	if err := d.client.StartTask(ctx, task.ID); err != nil {
		d.logger.Printf("failed to start task %s: %v", task.ID, err)
		return
	}

	prompt := d.buildPrompt(task)
	workDir := filepath.Join(d.cfg.WorkDir, task.WorkspaceID, task.ID)
	var skills []execenv.SkillData
	if task.Agent != nil {
		for _, sk := range task.Agent.Skills {
			var files []execenv.SkillFile
			for _, f := range sk.Files {
				files = append(files, execenv.SkillFile{Path: f.Path, Content: f.Content})
			}
			skills = append(skills, execenv.SkillData{Name: sk.Name, Content: sk.Content, Files: files})
		}
	}
	agentCtx := execenv.AgentContext{
		AgentName:    task.Provider,
		Instructions: "",
		Skills:       skills,
	}
	if task.Agent != nil {
		agentCtx.AgentName = task.Agent.Name
		agentCtx.Instructions = task.Agent.Instructions
	}
	if err := execenv.Prepare(workDir, agentCtx); err != nil {
		d.logger.Printf("failed to prepare execenv for task %s: %v", task.ID, err)
		os.MkdirAll(workDir, 0755)
	}

	entry, ok := d.cfg.Agents[task.Provider]
	if !ok {
		d.client.FailTask(ctx, task.ID, fmt.Sprintf("no agent configured for provider %s", task.Provider))
		return
	}

	backend, err := agent.New(task.Provider, agent.Config{
		ExecutablePath: entry.Path,
		Env: map[string]string{
			"OPENZOO_TOKEN":        d.cfg.Token,
			"OPENZOO_SERVER_URL":   d.cfg.ServerURL,
			"OPENZOO_WORKSPACE_ID": task.WorkspaceID,
			"OPENZOO_TASK_ID":      task.ID,
		},
	})
	if err != nil {
		d.client.FailTask(ctx, task.ID, fmt.Sprintf("create agent backend: %v", err))
		return
	}

	session, err := backend.Execute(ctx, prompt, agent.ExecOptions{
		Cwd:             workDir,
		Model:           entry.Model,
		Timeout:         d.cfg.AgentTimeout,
		ResumeSessionID: task.PriorSessionID,
	})
	if err != nil {
		if task.PriorSessionID != "" {
			d.logger.Printf("session resume failed for task %s, retrying with new session", task.ID)
			session, err = backend.Execute(ctx, prompt, agent.ExecOptions{
				Cwd:     workDir,
				Model:   entry.Model,
				Timeout: d.cfg.AgentTimeout,
			})
		}
		if err != nil {
			d.client.FailTask(ctx, task.ID, fmt.Sprintf("execute agent: %v", err))
			return
		}
	}

	var seq atomic.Int32
	var mu sync.Mutex
	var batch []TaskMessageData
	pendingText := &strings.Builder{}
	pendingThinking := &strings.Builder{}

	flush := func() {
		mu.Lock()
		defer mu.Unlock()
		if thinking := pendingThinking.String(); thinking != "" {
			batch = append(batch, TaskMessageData{Seq: seq.Add(1), Type: "thinking", Content: thinking})
			pendingThinking.Reset()
		}
		if text := pendingText.String(); text != "" {
			batch = append(batch, TaskMessageData{Seq: seq.Add(1), Type: "text", Content: text})
			pendingText.Reset()
		}
		if len(batch) > 0 {
			d.logger.Printf("reporting %d messages for task %s", len(batch), task.ID)
			if err := d.client.ReportMessages(ctx, task.ID, batch); err != nil {
				d.logger.Printf("report messages failed for task %s: %v", task.ID, err)
			}
			batch = nil
		}
	}

	ticker := time.NewTicker(500 * time.Millisecond)
	done := make(chan struct{})

	go func() {
		defer close(done)
		for {
			select {
			case <-ticker.C:
				flush()
				if status, err := d.client.GetTaskStatus(ctx, task.ID); err == nil && status == "cancelled" {
					d.logger.Printf("task %s was cancelled, aborting", task.ID)
					session.Cancel()
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	go func() {
		var count int
		for msg := range session.Messages {
			count++
			if count <= 3 {
				d.logger.Printf("task %s received message #%d type=%s", task.ID, count, msg.Type)
			}
			mu.Lock()
			switch msg.Type {
			case agent.MessageText:
				pendingText.WriteString(msg.Content)
			case agent.MessageThinking:
				pendingThinking.WriteString(msg.Content)
			case agent.MessageToolUse:
				flush()
				inputJSON, _ := json.Marshal(msg.Input)
				batch = append(batch, TaskMessageData{Seq: seq.Add(1), Type: "tool_use", Tool: msg.Tool, CallID: msg.CallID, Input: string(inputJSON)})
			case agent.MessageToolResult:
				output := msg.Output
				if len(output) > 8192 {
					output = output[:8192]
				}
				batch = append(batch, TaskMessageData{Seq: seq.Add(1), Type: "tool_result", CallID: msg.CallID, Output: output})
			case agent.MessageError:
				batch = append(batch, TaskMessageData{Seq: seq.Add(1), Type: "error", Content: msg.Content})
			}
			mu.Unlock()
		}
		d.logger.Printf("task %s message channel closed, total=%d", task.ID, count)
		flush()
		ticker.Stop()
	}()

	result := <-session.Result
	<-done

	d.logger.Printf("task %s finished with status=%s", task.ID, result.Status)

	switch result.Status {
	case "completed":
		d.client.CompleteTask(ctx, task.ID, TaskResult{
			Status:    "completed",
			Comment:   result.Output,
			SessionID: result.SessionID,
			WorkDir:   workDir,
		})
	case "failed", "timeout", "aborted":
		d.client.FailTask(ctx, task.ID, result.Error)
	default:
		d.client.FailTask(ctx, task.ID, fmt.Sprintf("unknown status: %s", result.Status))
	}
}
