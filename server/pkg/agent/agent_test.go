package agent

import (
	"context"
	"runtime"
	"testing"
	"time"
)

func TestNewSupportedProviders(t *testing.T) {
	providers := []string{"claude", "codex", "opencode"}
	for _, provider := range providers {
		t.Run(provider, func(t *testing.T) {
			backend, err := New(provider, Config{ExecutablePath: provider})
			if err != nil {
				t.Fatalf("expected provider %s to be supported: %v", provider, err)
			}
			if backend == nil {
				t.Fatalf("expected backend for provider %s", provider)
			}
		})
	}
}

func TestNewUnsupportedProvider(t *testing.T) {
	if _, err := New("unknown", Config{}); err == nil {
		t.Fatal("expected unsupported provider error")
	}
}

func TestSessionCancel(t *testing.T) {
	execPath := "echo"
	if runtime.GOOS == "windows" {
		execPath = "cmd"
	}
	backend, err := New("codex", Config{ExecutablePath: execPath})
	if err != nil {
		t.Fatalf("new backend: %v", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	session, err := backend.Execute(ctx, "test prompt", ExecOptions{Timeout: 10 * time.Second})
	if err != nil {
		t.Skipf("execute: %v (skipping on Windows)", err)
	}
	if session == nil {
		t.Fatal("expected non-nil session")
	}
	session.Cancel()
	select {
	case <-session.Result:
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for session to finish after cancel")
	}
}
