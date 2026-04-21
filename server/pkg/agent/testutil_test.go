package agent

import (
	"log/slog"
	"os"
	"testing"
)

func testLogger(t *testing.T) *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug}))
}
