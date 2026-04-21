package queue

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type TaskEvent struct {
	TaskID     string `json:"task_id"`
	IssueID    string `json:"issue_id"`
	RuntimeID  string `json:"runtime_id"`
	AgentID    string `json:"agent_id"`
	Status     string `json:"status"`
	OccurredAt int64  `json:"occurred_at"`
}

type TaskQueue interface {
	Enqueue(ctx context.Context, event TaskEvent) error
	DeadLetter(ctx context.Context, event TaskEvent, reason string) error
}

type redisTaskQueue struct {
	client   *redis.Client
	stream   string
	dlq      string
	maxRetry int
}

func NewTaskQueueFromEnv() TaskQueue {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		return noopQueue{}
	}
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	return &redisTaskQueue{
		client:   client,
		stream:   envOr("TASK_STREAM", "openzoo:tasks"),
		dlq:      envOr("TASK_DLQ_STREAM", "openzoo:tasks:dlq"),
		maxRetry: 3,
	}
}

func (q *redisTaskQueue) Enqueue(ctx context.Context, event TaskEvent) error {
	raw, _ := json.Marshal(event)
	return q.client.XAdd(ctx, &redis.XAddArgs{
		Stream: q.stream,
		Values: map[string]any{"payload": string(raw), "status": event.Status},
	}).Err()
}

func (q *redisTaskQueue) DeadLetter(ctx context.Context, event TaskEvent, reason string) error {
	raw, _ := json.Marshal(event)
	return q.client.XAdd(ctx, &redis.XAddArgs{
		Stream: q.dlq,
		Values: map[string]any{
			"payload": string(raw),
			"reason":  reason,
			"at":      time.Now().UTC().Format(time.RFC3339),
		},
	}).Err()
}

type noopQueue struct{}

func (noopQueue) Enqueue(context.Context, TaskEvent) error { return nil }
func (noopQueue) DeadLetter(context.Context, TaskEvent, string) error { return nil }

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
