package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/queue"
)

type TaskService struct {
	db    *pgxpool.Pool
	queue queue.TaskQueue
}

func NewTaskService(db *pgxpool.Pool) *TaskService {
	return &TaskService{db: db, queue: queue.NewTaskQueueFromEnv()}
}

type Task struct {
	ID          string     `json:"id"`
	AgentID     string     `json:"agent_id"`
	RuntimeID   string     `json:"runtime_id"`
	IssueID     string     `json:"issue_id"`
	Status      string     `json:"status"`
	Priority    int        `json:"priority"`
	DispatchedAt *time.Time `json:"dispatched_at"`
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	Result      *string    `json:"result_json"`
	Error       *string    `json:"error"`
	CreatedAt   time.Time  `json:"created_at"`
}

type TaskMessage struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	IssueID   string    `json:"issue_id"`
	Seq       int       `json:"seq"`
	Type      string    `json:"type"`
	Tool      *string   `json:"tool"`
	Content   *string   `json:"content"`
	Input     *string   `json:"input"`
	Output    *string   `json:"output"`
	CreatedAt time.Time `json:"created_at"`
}

func (s *TaskService) Create(ctx context.Context, issueID, runtimeID, agentID, prompt string) (*Task, error) {
	id := uuid.New().String()
	now := time.Now()
	_, err := s.db.Exec(ctx, `INSERT INTO tasks (id, agent_id, runtime_id, issue_id, status, priority, created_at) VALUES ($1,$2,$3,$4,'queued',0,$5)`,
		id, agentID, runtimeID, issueID, now)
	if err != nil {
		return nil, err
	}
	task := &Task{ID: id, AgentID: agentID, RuntimeID: runtimeID, IssueID: issueID, Status: "queued", CreatedAt: now}
	_ = s.queue.Enqueue(ctx, queue.TaskEvent{
		TaskID:     task.ID,
		IssueID:    task.IssueID,
		RuntimeID:  task.RuntimeID,
		AgentID:    task.AgentID,
		Status:     task.Status,
		OccurredAt: time.Now().Unix(),
	})
	return task, nil
}

func (s *TaskService) Get(ctx context.Context, taskID string) (*Task, error) {
	var t Task
	err := s.db.QueryRow(ctx, `SELECT id, agent_id, runtime_id, issue_id, status, COALESCE(priority,0), dispatched_at, started_at, completed_at, result, error, created_at FROM tasks WHERE id = $1`, taskID).
		Scan(&t.ID, &t.AgentID, &t.RuntimeID, &t.IssueID, &t.Status, &t.Priority, &t.DispatchedAt, &t.StartedAt, &t.CompletedAt, &t.Result, &t.Error, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *TaskService) List(ctx context.Context, workspaceID, issueID, agentID, status string, limit, offset int) ([]Task, int, error) {
	query := `SELECT t.id, t.agent_id, t.runtime_id, t.issue_id, t.status, COALESCE(t.priority,0), t.dispatched_at, t.started_at, t.completed_at, t.result, t.error, t.created_at FROM tasks t JOIN issues i ON t.issue_id = i.id WHERE i.workspace_id = $1`
	args := []interface{}{workspaceID}
	argN := 2
	if issueID != "" {
		query += fmt.Sprintf(` AND t.issue_id = $%d`, argN)
		args = append(args, issueID)
		argN++
	}
	if agentID != "" {
		query += fmt.Sprintf(` AND t.agent_id = $%d`, argN)
		args = append(args, agentID)
		argN++
	}
	if status != "" {
		query += fmt.Sprintf(` AND t.status = $%d`, argN)
		args = append(args, status)
		argN++
	}
	var total int
	countQ := `SELECT COUNT(*) FROM (` + query + `) sub`
	if err := s.db.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(` ORDER BY t.created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	args = append(args, limit, offset)
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var tasks []Task
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.AgentID, &t.RuntimeID, &t.IssueID, &t.Status, &t.Priority, &t.DispatchedAt, &t.StartedAt, &t.CompletedAt, &t.Result, &t.Error, &t.CreatedAt); err != nil {
			return nil, 0, err
		}
		tasks = append(tasks, t)
	}
	return tasks, total, nil
}

func (s *TaskService) UpdateStatus(ctx context.Context, taskID, status string, taskErr, result *string) (*Task, error) {
	now := time.Now()
	switch status {
	case "dispatched":
		s.db.Exec(ctx, `UPDATE tasks SET status = $2, dispatched_at = $3 WHERE id = $1`, taskID, status, now)
	case "running":
		s.db.Exec(ctx, `UPDATE tasks SET status = $2, started_at = $3 WHERE id = $1`, taskID, status, now)
	case "completed", "failed", "cancelled":
		s.db.Exec(ctx, `UPDATE tasks SET status = $2, completed_at = $3 WHERE id = $1`, taskID, status, now)
	default:
		s.db.Exec(ctx, `UPDATE tasks SET status = $2 WHERE id = $1`, taskID, status)
	}
	if taskErr != nil {
		s.db.Exec(ctx, `UPDATE tasks SET error = $2 WHERE id = $1`, taskID, *taskErr)
	}
	if result != nil {
		s.db.Exec(ctx, `UPDATE tasks SET result = $2 WHERE id = $1`, taskID, *result)
	}
	updated, err := s.Get(ctx, taskID)
	if err != nil {
		return nil, err
	}
	event := queue.TaskEvent{
		TaskID:     updated.ID,
		IssueID:    updated.IssueID,
		RuntimeID:  updated.RuntimeID,
		AgentID:    updated.AgentID,
		Status:     updated.Status,
		OccurredAt: time.Now().Unix(),
	}
	if status == "failed" {
		_ = s.queue.DeadLetter(ctx, event, "task_status_failed")
	} else {
		_ = s.queue.Enqueue(ctx, event)
	}
	return updated, nil
}

func (s *TaskService) ListMessages(ctx context.Context, taskID string, limit, offset int) ([]TaskMessage, error) {
	if limit <= 0 {
		limit = 200
	}
	rows, err := s.db.Query(ctx, `SELECT id, task_id, issue_id, seq, type, tool, content, input, output, created_at FROM task_messages WHERE task_id = $1 ORDER BY seq ASC LIMIT $2 OFFSET $3`, taskID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []TaskMessage
	for rows.Next() {
		var m TaskMessage
		if err := rows.Scan(&m.ID, &m.TaskID, &m.IssueID, &m.Seq, &m.Type, &m.Tool, &m.Content, &m.Input, &m.Output, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

type ClaimedTask struct {
	ID          string `json:"id"`
	AgentID     string `json:"agent_id"`
	RuntimeID   string `json:"runtime_id"`
	IssueID     string `json:"issue_id"`
	WorkspaceID string `json:"workspace_id"`
}

func (s *TaskService) ClaimTask(ctx context.Context, runtimeID string) (*ClaimedTask, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var taskID, agentID, runtimeIDVal, issueID, workspaceID string
	err = tx.QueryRow(ctx, `
		UPDATE tasks SET status = 'dispatched', dispatched_at = NOW(), runtime_id = $1
		WHERE id = (
			SELECT t.id FROM tasks t
			JOIN issues i ON t.issue_id = i.id
			JOIN agents a ON t.agent_id = a.id
			WHERE t.status = 'queued'
			  AND a.archived_at IS NULL
			  AND (
			    SELECT COUNT(*) FROM tasks t2
			    WHERE t2.agent_id = t.agent_id AND t2.status IN ('dispatched','running')
			  ) < a.max_concurrent_tasks
			  AND NOT EXISTS (
			    SELECT 1 FROM tasks active
			    WHERE active.agent_id = t.agent_id
			      AND active.status IN ('dispatched','running')
			      AND active.issue_id = t.issue_id
			  )
			ORDER BY t.priority DESC, t.created_at ASC
			LIMIT 1
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, agent_id, runtime_id, issue_id
	`, runtimeID).Scan(&taskID, &agentID, &runtimeIDVal, &issueID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	err = tx.QueryRow(ctx, `SELECT workspace_id FROM issues WHERE id = $1`, issueID).Scan(&workspaceID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	_ = s.queue.Enqueue(ctx, queue.TaskEvent{
		TaskID: taskID, IssueID: issueID, RuntimeID: runtimeIDVal,
		AgentID: agentID, Status: "dispatched", OccurredAt: time.Now().Unix(),
	})

	return &ClaimedTask{
		ID: taskID, AgentID: agentID, RuntimeID: runtimeIDVal,
		IssueID: issueID, WorkspaceID: workspaceID,
	}, nil
}

func (s *TaskService) StartTask(ctx context.Context, taskID string) error {
	_, err := s.db.Exec(ctx, `UPDATE tasks SET status = 'running', started_at = NOW() WHERE id = $1 AND status = 'dispatched'`, taskID)
	if err != nil {
		return err
	}
	task, err := s.Get(ctx, taskID)
	if err != nil {
		return fmt.Errorf("start task succeeded but failed to enqueue event: %w", err)
	}
	_ = s.queue.Enqueue(ctx, queue.TaskEvent{
		TaskID: taskID, IssueID: task.IssueID, RuntimeID: task.RuntimeID,
		AgentID: task.AgentID, Status: "running", OccurredAt: time.Now().Unix(),
	})
	return nil
}

func (s *TaskService) CompleteTask(ctx context.Context, taskID string, resultJSON, comment string) error {
	_, err := s.db.Exec(ctx, `UPDATE tasks SET status = 'completed', completed_at = NOW(), result = $2 WHERE id = $1`, taskID, resultJSON)
	if err != nil {
		return err
	}
	task, err := s.Get(ctx, taskID)
	if err != nil {
		return fmt.Errorf("complete task succeeded but failed to post-process: %w", err)
	}
	if comment != "" && task.IssueID != "" {
		commentID := uuid.New().String()
		s.db.Exec(ctx,
			`INSERT INTO comments (id, issue_id, workspace_id, author_type, author_id, content, type, created_at, updated_at)
			 VALUES ($1, $2, (SELECT workspace_id FROM issues WHERE id = $2), 'agent', $3, $4, 'progress_update', NOW(), NOW())`,
			commentID, task.IssueID, task.AgentID, comment)
	}
	_ = s.queue.Enqueue(ctx, queue.TaskEvent{
		TaskID: taskID, IssueID: task.IssueID, RuntimeID: task.RuntimeID,
		AgentID: task.AgentID, Status: "completed", OccurredAt: time.Now().Unix(),
	})
	return nil
}

func (s *TaskService) FailTask(ctx context.Context, taskID string, errMsg string) error {
	_, err := s.db.Exec(ctx, `UPDATE tasks SET status = 'failed', completed_at = NOW(), error = $2 WHERE id = $1`, taskID, errMsg)
	if err != nil {
		return err
	}
	task, err := s.Get(ctx, taskID)
	if err != nil {
		return fmt.Errorf("fail task succeeded but failed to enqueue dead letter: %w", err)
	}
	_ = s.queue.DeadLetter(ctx, queue.TaskEvent{
		TaskID: taskID, IssueID: task.IssueID, RuntimeID: task.RuntimeID,
		AgentID: task.AgentID, Status: "failed", OccurredAt: time.Now().Unix(),
	}, errMsg)
	return nil
}

type TaskUsage struct {
	Provider       string `json:"provider"`
	Model          string `json:"model"`
	InputTokens    int    `json:"input_tokens"`
	OutputTokens   int    `json:"output_tokens"`
	CacheReadTokens  int  `json:"cache_read_tokens,omitempty"`
	CacheWriteTokens int  `json:"cache_write_tokens,omitempty"`
}

func (s *TaskService) ReportTaskUsage(ctx context.Context, taskID string, usage TaskUsage) error {
	usageJSON, err := json.Marshal(map[string]interface{}{
		"usage": usage,
	})
	if err != nil {
		return fmt.Errorf("marshal usage: %w", err)
	}
	_, err = s.db.Exec(ctx, `
		UPDATE tasks SET result = COALESCE(result, '{}')::jsonb || $2::jsonb WHERE id = $1`,
		taskID, string(usageJSON))
	return err
}

type InboundMessage struct {
	Seq     int32  `json:"seq"`
	Type    string `json:"type"`
	Content string `json:"content,omitempty"`
	Tool    string `json:"tool,omitempty"`
	CallID  string `json:"call_id,omitempty"`
	Input   string `json:"input,omitempty"`
	Output  string `json:"output,omitempty"`
}

func (s *TaskService) ReportMessages(ctx context.Context, taskID string, messages []InboundMessage) error {
	task, err := s.Get(ctx, taskID)
	if err != nil {
		return fmt.Errorf("report-messages: get task %s: %w", taskID, err)
	}
	for i, msg := range messages {
		msgID := uuid.New().String()
		var toolName, inputJSON *string
		if msg.Tool != "" {
			toolName = &msg.Tool
		}
		if msg.Input != "" {
			inputJSON = &msg.Input
		}
		if _, err := s.db.Exec(ctx,
			`INSERT INTO task_messages (id, task_id, issue_id, seq, type, tool, content, input, output, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
			msgID, taskID, task.IssueID, msg.Seq, msg.Type, toolName, msg.Content, inputJSON, msg.Output); err != nil {
			return fmt.Errorf("report-messages: insert msg[%d] for task %s: %w", i, taskID, err)
		}
	}
	return nil
}

func (s *TaskService) CancelTask(ctx context.Context, taskID string) error {
	now := time.Now()
	tag, err := s.db.Exec(ctx,
		`UPDATE tasks SET status = 'cancelled', completed_at = $2 WHERE id = $1 AND status IN ('queued','dispatched','running')`,
		taskID, now)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("task %s not found or not cancellable", taskID)
	}
	return nil
}

func (s *TaskService) CancelTasksByAgent(ctx context.Context, agentID string) (int, error) {
	tag, err := s.db.Exec(ctx,
		`UPDATE tasks SET status = 'cancelled', completed_at = NOW() WHERE agent_id = $1 AND status IN ('queued','dispatched','running')`,
		agentID)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}

func (s *TaskService) FailStaleTasks(ctx context.Context) error {
	tag, err := s.db.Exec(ctx, `
		UPDATE tasks SET status = 'failed', error = 'task timed out', completed_at = NOW()
		WHERE (status = 'dispatched' AND dispatched_at < NOW() - INTERVAL '5 minutes')
		   OR (status = 'running' AND started_at < NOW() - INTERVAL '30 minutes')
	`)
	if err != nil {
		return err
	}
	if n := tag.RowsAffected(); n > 0 {
		log.Printf("[task] failed %d stale tasks", n)
	}
	return nil
}

func ReconcileAgentStatus(ctx context.Context, db *pgxpool.Pool, agentID string) error {
	var runningCount int
	err := db.QueryRow(ctx,
		`SELECT COUNT(*) FROM tasks WHERE agent_id = $1 AND status IN ('queued','dispatched','running')`,
		agentID).Scan(&runningCount)
	if err != nil {
		return err
	}
	status := "idle"
	if runningCount > 0 {
		status = "working"
	}
	_, err = db.Exec(ctx, `UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2`, status, agentID)
	return err
}
