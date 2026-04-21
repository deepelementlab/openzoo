package daemon

import (
	"context"
	"testing"
	"time"
)

func TestEnvOrDefault(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		fallback string
		want     string
	}{
		{"empty key returns fallback", "NONEXISTENT_KEY_12345", "default", "default"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := envOrDefault(tt.key, tt.fallback); got != tt.want {
				t.Errorf("envOrDefault() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestDurationFromEnv(t *testing.T) {
	got, err := durationFromEnv("NONEXISTENT_DURATION_KEY", 5*time.Second)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 5*time.Second {
		t.Errorf("durationFromEnv() = %v, want 5s", got)
	}
}

func TestIntFromEnv(t *testing.T) {
	got, err := intFromEnv("NONEXISTENT_INT_KEY", 42)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 42 {
		t.Errorf("intFromEnv() = %v, want 42", got)
	}
}

func TestSleepWithContext(t *testing.T) {
	start := time.Now()
	err := sleepWithContext(context.Background(), 10*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if time.Since(start) < 10*time.Millisecond {
		t.Error("sleepWithContext returned too early")
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.ServerURL == "" {
		t.Error("DefaultConfig ServerURL should not be empty")
	}
	if cfg.HealthPort == 0 {
		t.Error("DefaultConfig HealthPort should not be 0")
	}
	if cfg.MaxConcurrentTasks == 0 {
		t.Error("DefaultConfig MaxConcurrentTasks should not be 0")
	}
	if cfg.PollInterval == 0 {
		t.Error("DefaultConfig PollInterval should not be 0")
	}
	if cfg.HeartbeatInterval == 0 {
		t.Error("DefaultConfig HeartbeatInterval should not be 0")
	}
}

func TestParseWorkspaceIDsFromConfig(t *testing.T) {
	result := ParseWorkspaceIDsFromConfig("")
	if result != nil {
		t.Errorf("ParseWorkspaceIDsFromConfig('') = %v, want nil", result)
	}
}

func TestConfigModTime(t *testing.T) {
	_, ok := ConfigModTime("")
	if ok {
		t.Error("ConfigModTime('') should return false")
	}
	_, ok = ConfigModTime("/nonexistent/path/config.toml")
	if ok {
		t.Error("ConfigModTime for nonexistent file should return false")
	}
}
