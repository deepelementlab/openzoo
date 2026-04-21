package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type HealthResponse struct {
	Status     string              `json:"status"`
	PID        int                 `json:"pid"`
	Uptime     string              `json:"uptime"`
	DaemonID   string              `json:"daemon_id"`
	DeviceName string              `json:"device_name"`
	ServerURL  string              `json:"server_url"`
	Agents     map[string]AgentEntry `json:"agents"`
	Workspaces []WorkspaceHealth   `json:"workspaces"`
}

type WorkspaceHealth struct {
	WorkspaceID string   `json:"workspace_id"`
	RuntimeIDs  []string `json:"runtime_ids"`
}

var daemonStartTime time.Time

func (d *Daemon) serveHealth(ctx context.Context) {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		d.mu.RLock()
		defer d.mu.RUnlock()

		var workspaces []WorkspaceHealth
		for wsID, state := range d.workspaces {
			var rtIDs []string
			for id := range state.RuntimeIDs {
				rtIDs = append(rtIDs, id)
			}
			workspaces = append(workspaces, WorkspaceHealth{WorkspaceID: wsID, RuntimeIDs: rtIDs})
		}

		resp := HealthResponse{
			Status:     "running",
			PID:        os.Getpid(),
			Uptime:     time.Since(daemonStartTime).String(),
			DaemonID:   d.cfg.DaemonID,
			DeviceName: d.cfg.DeviceName,
			ServerURL:  d.cfg.ServerURL,
			Agents:     d.cfg.Agents,
			Workspaces: workspaces,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	})

	addr := fmt.Sprintf(":%d", d.cfg.HealthPort)
	server := &http.Server{Addr: addr, Handler: mux}

	go func() {
		d.logger.Printf("health endpoint on %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			d.logger.Printf("health endpoint error: %v", err)
		}
	}()

	go func() {
		<-ctx.Done()
		server.Shutdown(context.Background())
	}()
}

