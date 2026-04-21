package queue

import (
	"context"
	"os"
	"testing"
)

func TestNewTaskQueueFromEnv_FallbackNoop(t *testing.T) {
	t.Setenv("REDIS_ADDR", "")
	q := NewTaskQueueFromEnv()
	if err := q.Enqueue(context.Background(), TaskEvent{TaskID: "t-1", Status: "queued"}); err != nil {
		t.Fatalf("noop enqueue should not fail: %v", err)
	}
}

func TestNewTaskQueueFromEnv_RedisConfigured(t *testing.T) {
	t.Setenv("REDIS_ADDR", "127.0.0.1:6379")
	q := NewTaskQueueFromEnv()
	if _, ok := q.(*redisTaskQueue); !ok {
		t.Fatalf("expected redisTaskQueue when REDIS_ADDR set, got %T", q)
	}
	_ = os.Unsetenv("REDIS_ADDR")
}
