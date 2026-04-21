package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/spf13/cobra"
)

func newRootForTest() *cobra.Command {
	root := &cobra.Command{Use: "openzoo"}
	registerCommands(root)
	return root
}

func TestCompatibilityCommandsRemainAvailable(t *testing.T) {
	root := newRootForTest()
	commands := []string{"auth", "workspace", "issue", "agent", "skill", "runtime", "daemon", "project"}
	for _, name := range commands {
		t.Run(name, func(t *testing.T) {
			if _, _, err := root.Find([]string{name}); err != nil {
				t.Fatalf("expected command %s to exist: %v", name, err)
			}
		})
	}
}

func TestDaemonCommandCallsHealthEndpoint(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	}))
	defer srv.Close()

	root := newRootForTest()
	root.SetArgs([]string{"daemon", "--server-url", srv.URL})

	if err := root.Execute(); err != nil {
		t.Fatalf("daemon command failed: %v", err)
	}
}
