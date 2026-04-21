package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/openzoo-ai/openzoo/server/internal/daemon/discovery"
	"github.com/openzoo-ai/openzoo/server/internal/database"
	"github.com/openzoo-ai/openzoo/server/internal/service"
	"github.com/openzoo-ai/openzoo/server/pkg/agent"
)

type EmbeddedDaemon struct {
	id            string
	workspaceID   string
	provider      string
	agentPath     string
	maxConcurrent int
	taskSvc       *service.TaskService
	daemonSvc     *service.DaemonService
	extSessionSvc *service.ExternalSessionService
	runtimeID     string
	logger        *log.Logger

	running  atomic.Bool
	cancel   context.CancelFunc
	wg       sync.WaitGroup
	sem      chan struct{}
}

type EmbeddedConfig struct {
	WorkspaceID   string
	Provider      string
	AgentPath     string
	MaxConcurrent int
}

func NewEmbeddedDaemon(cfg EmbeddedConfig, taskSvc *service.TaskService, daemonSvc *service.DaemonService) *EmbeddedDaemon {
	if cfg.MaxConcurrent <= 0 {
		cfg.MaxConcurrent = 5
	}
	if cfg.Provider == "" {
		cfg.Provider = "claude"
	}
	if cfg.AgentPath == "" {
		cfg.AgentPath = "claude"
	}
	return &EmbeddedDaemon{
		id:            uuid.New().String(),
		workspaceID:   cfg.WorkspaceID,
		provider:      cfg.Provider,
		agentPath:     cfg.AgentPath,
		maxConcurrent: cfg.MaxConcurrent,
		taskSvc:       taskSvc,
		daemonSvc:     daemonSvc,
		logger:        log.New(log.Writer(), "[embedded-daemon] ", log.LstdFlags),
		sem:           make(chan struct{}, cfg.MaxConcurrent),
	}
}

func (e *EmbeddedDaemon) Start() error {
	if e.running.Load() {
		return fmt.Errorf("embedded daemon already running")
	}

	ctx, cancel := context.WithCancel(context.Background())
	e.cancel = cancel

	runtimeID := uuid.New().String()
	e.runtimeID = runtimeID

	now := time.Now()
	pool := database.Pool()
	_, err := pool.Exec(ctx,
		`INSERT INTO runtimes (id, workspace_id, daemon_id, name, runtime_mode, provider, status, device_info, last_seen_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, 'local', $5, 'online', $6, $7, $7, $7)`,
		runtimeID, e.workspaceID, e.id, "embedded-"+e.provider, e.provider, "embedded=true", now)
	if err != nil {
		cancel()
		return fmt.Errorf("register runtime: %w", err)
	}

	e.running.Store(true)

	e.wg.Add(5)
	go e.pollLoop(ctx)
	go e.heartbeatLoop(ctx)
	go e.staleSweepLoop(ctx)
	go e.discoveryLoop(ctx)
	go e.adoptionLoop(ctx)

	e.logger.Printf("started embedded daemon %s runtime=%s workspace=%s provider=%s", e.id, runtimeID, e.workspaceID, e.provider)
	return nil
}

func (e *EmbeddedDaemon) Stop() {
	if !e.running.Load() {
		return
	}
	e.running.Store(false)
	if e.cancel != nil {
		e.cancel()
	}

	done := make(chan struct{})
	go func() {
		e.wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-time.After(30 * time.Second):
		e.logger.Printf("timed out waiting for tasks to complete")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = e.daemonSvc.Unregister(ctx, e.runtimeID)
	e.logger.Printf("stopped embedded daemon %s", e.id)
}

func (e *EmbeddedDaemon) IsRunning() bool {
	return e.running.Load()
}

func (e *EmbeddedDaemon) Status() map[string]interface{} {
	return map[string]interface{}{
		"id":           e.id,
		"runtime_id":   e.runtimeID,
		"workspace_id": e.workspaceID,
		"provider":     e.provider,
		"running":      e.running.Load(),
		"max_concurrent": e.maxConcurrent,
	}
}

func (e *EmbeddedDaemon) pollLoop(ctx context.Context) {
	defer e.wg.Done()
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !e.running.Load() {
				return
			}
			e.tryClaim(ctx)
		}
	}
}

func (e *EmbeddedDaemon) tryClaim(ctx context.Context) {
	select {
	case e.sem <- struct{}{}:
	default:
		return
	}

	task, err := e.taskSvc.ClaimTask(ctx, e.runtimeID)
	if err != nil || task == nil {
		<-e.sem
		return
	}

	e.wg.Add(1)
	go func() {
		defer e.wg.Done()
		defer func() { <-e.sem }()
		e.executeTask(ctx, task)
	}()
}

func (e *EmbeddedDaemon) executeTask(ctx context.Context, task *service.ClaimedTask) {
	logger := log.New(log.Writer(), fmt.Sprintf("[embedded-daemon task=%s] ", task.ID[:8]), log.LstdFlags)

	cfg := agent.Config{
		ExecutablePath: e.agentPath,
	}
	backend, err := agent.New(e.provider, cfg)
	if err != nil {
		logger.Printf("create agent backend: %v", err)
		errStr := fmt.Sprintf("agent backend error: %v", err)
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "failed", &errStr, nil)
		return
	}

	workDir := fmt.Sprintf("%s%copenzoo-work%c%s%c%s", os.TempDir(), os.PathSeparator, os.PathSeparator, task.WorkspaceID, os.PathSeparator, task.ID[:8])
	sessionCtx, sessionCancel := context.WithTimeout(ctx, 30*time.Minute)
	defer sessionCancel()

	var issueTitle string
	_ = database.Pool().QueryRow(ctx, `SELECT title FROM issues WHERE id = $1`, task.IssueID).Scan(&issueTitle)

	opts := agent.ExecOptions{
		Cwd:     workDir,
		Timeout: 30 * time.Minute,
	}

	session, err := backend.Execute(sessionCtx, issueTitle, opts)
	if err != nil {
		logger.Printf("exec agent: %v", err)
		errStr := fmt.Sprintf("exec error: %v", err)
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "failed", &errStr, nil)
		return
	}

	var seq int32
	var msgBatch []service.InboundMessage
	var mu sync.Mutex
	var flushTimer *time.Ticker

	flush := func() {
		mu.Lock()
		defer mu.Unlock()
		if len(msgBatch) > 0 {
			if err := e.taskSvc.ReportMessages(ctx, task.ID, msgBatch); err != nil {
				logger.Printf("report messages: %v", err)
			}
			msgBatch = nil
		}
	}

	flushTimer = time.NewTicker(500 * time.Millisecond)
	defer flushTimer.Stop()

	go func() {
		for {
			select {
			case <-sessionCtx.Done():
				return
			case <-flushTimer.C:
				flush()
			}
		}
	}()

	for msg := range session.Messages {
		seq++
		mu.Lock()
		switch msg.Type {
		case agent.MessageText:
			msgBatch = append(msgBatch, service.InboundMessage{Seq: seq, Type: "text", Content: msg.Content})
		case agent.MessageThinking:
			msgBatch = append(msgBatch, service.InboundMessage{Seq: seq, Type: "thinking", Content: msg.Content})
		case agent.MessageToolUse:
			inputJSON, _ := json.Marshal(msg.Input)
			msgBatch = append(msgBatch, service.InboundMessage{Seq: seq, Type: "tool_use", Tool: msg.Tool, CallID: msg.CallID, Input: string(inputJSON)})
		case agent.MessageToolResult:
			msgBatch = append(msgBatch, service.InboundMessage{Seq: seq, Type: "tool_result", CallID: msg.CallID, Output: msg.Output})
		case agent.MessageError:
			msgBatch = append(msgBatch, service.InboundMessage{Seq: seq, Type: "error", Content: msg.Content})
		}
		mu.Unlock()
	}

	flush()

	var result agent.Result
	select {
	case result = <-session.Result:
	default:
	}

	switch result.Status {
	case "completed":
		output := result.Output
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "completed", nil, &output)
	case "failed":
		errStr := result.Error
		if errStr == "" {
			errStr = "execution failed"
		}
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "failed", &errStr, nil)
	case "timeout":
		errStr := "execution timed out"
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "failed", &errStr, nil)
	default:
		errStr := "no result from agent"
		_, _ = e.taskSvc.UpdateStatus(ctx, task.ID, "failed", &errStr, nil)
	}

	_ = service.ReconcileAgentStatus(ctx, database.Pool(), task.AgentID)
}

func (e *EmbeddedDaemon) heartbeatLoop(ctx context.Context) {
	defer e.wg.Done()
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := e.daemonSvc.Heartbeat(ctx, e.runtimeID); err != nil {
				e.logger.Printf("heartbeat: %v", err)
			}
		}
	}
}

func (e *EmbeddedDaemon) staleSweepLoop(ctx context.Context) {
	defer e.wg.Done()
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			_ = e.taskSvc.FailStaleTasks(ctx)
			_ = e.daemonSvc.SweepOffline(ctx, 60*time.Second)
		}
	}
}

func (e *EmbeddedDaemon) discoveryLoop(ctx context.Context) {
	defer e.wg.Done()
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !e.running.Load() {
				return
			}
			e.discoverExternalSessions(ctx)
		}
	}
}

func (e *EmbeddedDaemon) discoverExternalSessions(ctx context.Context) {
	if e.extSessionSvc == nil {
		return
	}

	processes, err := discovery.ScanClaudeProcesses(ctx)
	if err != nil {
		e.logger.Printf("discover external: process scan: %v", err)
		return
	}

	sessions, err := discovery.ScanClaudeSessions(ctx)
	if err != nil {
		e.logger.Printf("discover external: session scan: %v", err)
		return
	}

	matched := discovery.MatchProcessesWithSessions(processes, sessions)

	for _, m := range matched {
		meta, _ := json.Marshal(map[string]interface{}{
			"confidence":    m.Confidence,
			"claude_path":   m.Process.ExecPath,
			"model":         m.Session.Model,
			"last_modified": m.Session.LastModified,
		})

		in := service.RegisterExternalSessionInput{
			WorkspaceID:     e.workspaceID,
			SessionID:       m.Session.SessionID,
			PID:             m.Process.PID,
			ProcessCwd:      m.Process.Cwd,
			SessionFilePath: m.Session.SessionFilePath,
			Metadata:        meta,
		}

		es, err := e.extSessionSvc.UpsertByPID(ctx, in)
		if err != nil {
			e.logger.Printf("discover external: upsert pid=%d: %v", m.Process.PID, err)
			continue
		}
		if es != nil {
			e.logger.Printf("discover external: session=%s pid=%d status=%s", es.ID[:8], es.PID, es.Status)
		}
	}

	activePIDs := make(map[int]bool)
	for _, m := range matched {
		if m.Process.PID > 0 {
			activePIDs[m.Process.PID] = true
		}
	}

	if len(activePIDs) > 0 {
		cleaned, err := e.extSessionSvc.CleanupLostSessions(ctx, 10*time.Minute)
		if err == nil && cleaned > 0 {
			e.logger.Printf("discover external: cleaned %d lost sessions", cleaned)
		}
	}
}

func (e *EmbeddedDaemon) adoptionLoop(ctx context.Context) {
	defer e.wg.Done()
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !e.running.Load() {
				return
			}
			e.manageAdoptedSessions(ctx)
		}
	}
}

func (e *EmbeddedDaemon) manageAdoptedSessions(ctx context.Context) {
	if e.extSessionSvc == nil {
		return
	}

	sessions, err := e.extSessionSvc.ListDiscovered(ctx, e.workspaceID)
	if err != nil {
		return
	}

	for _, es := range sessions {
		if es.Status != "monitoring" && es.Status != "adopted" {
			continue
		}

		if es.PID > 0 {
			if discovery.IsProcessRunning(es.PID) {
				_ = e.extSessionSvc.TouchLastSeen(ctx, es.ID)
			} else {
				e.logger.Printf("adoption: session %s pid=%d no longer running", es.ID[:8], es.PID)
				_ = e.extSessionSvc.UpdateStatus(ctx, es.ID, "lost")
			}
		} else if es.SessionFilePath != "" {
			if _, err := os.Stat(es.SessionFilePath); err == nil {
				_ = e.extSessionSvc.TouchLastSeen(ctx, es.ID)
			} else {
				_ = e.extSessionSvc.UpdateStatus(ctx, es.ID, "lost")
			}
		}
	}
}
