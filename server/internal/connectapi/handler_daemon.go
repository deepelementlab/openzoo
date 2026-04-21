package connectapi

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/google/uuid"

	"github.com/openzoo-ai/openzoo/server/internal/daemon"
	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) registerDaemon(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	if wsID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	name := getStr(in, "name")
	if name == "" {
		name = "daemon-" + uuid.New().String()[:8]
	}
	d, err := h.daemon.Register(r.Context(), name, getStr(in, "runtime_id"), wsID, getInt(in, "pid"), getInt(in, "port"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, d)
}

func (h *Handler) unregisterDaemon(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	daemonID := getStr(in, "daemon_id")
	if daemonID == "" {
		writeJSON(w, 400, map[string]string{"error": "daemon_id is required"})
		return
	}
	if err := h.daemon.Unregister(r.Context(), daemonID); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) listDaemons(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	daemons, err := h.daemon.List(r.Context(), wsID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if daemons == nil {
		daemons = []service.Daemon{}
	}
	writeJSON(w, 200, map[string]interface{}{"daemons": daemons})
}

func (h *Handler) getDaemonDetail(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	daemonID := getStr(in, "daemon_id")
	if daemonID == "" {
		writeJSON(w, 400, map[string]string{"error": "daemon_id is required"})
		return
	}
	d, err := h.daemon.Get(r.Context(), daemonID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "daemon not found"})
		return
	}
	writeJSON(w, 200, d)
}

func (h *Handler) daemonHeartbeat(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	daemonID := getStr(in, "daemon_id")
	if daemonID == "" {
		writeJSON(w, 400, map[string]string{"error": "daemon_id is required"})
		return
	}
	if err := h.daemon.Heartbeat(r.Context(), daemonID); err != nil {
		writeJSON(w, 404, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) daemonStats(w http.ResponseWriter, r *http.Request) {
	stats := h.daemon.GetStats(r.Context())
	writeJSON(w, 200, stats)
}

func (h *Handler) claimTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	runtimeID := getStr(in, "runtime_id")
	if runtimeID == "" {
		writeJSON(w, 400, map[string]string{"error": "runtime_id is required"})
		return
	}
	task, err := h.task.ClaimTask(r.Context(), runtimeID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if task == nil {
		writeJSON(w, 200, map[string]interface{}{"task": nil})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"task": task})
}

func (h *Handler) startTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	taskID := getStr(in, "task_id")
	if taskID == "" {
		writeJSON(w, 400, map[string]string{"error": "task_id is required"})
		return
	}
	if err := h.task.StartTask(r.Context(), taskID); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publishTaskEvent(r, taskID, "task:started")
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) completeTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	taskID := getStr(in, "task_id")
	if taskID == "" {
		writeJSON(w, 400, map[string]string{"error": "task_id is required"})
		return
	}
	resultData := in["result"]
	var resultJSON, comment string
	if resultData != nil {
		b, _ := json.Marshal(resultData)
		resultJSON = string(b)
		if m, ok := resultData.(map[string]interface{}); ok {
			if c, ok := m["comment"].(string); ok {
				comment = c
			}
		}
	}
	if err := h.task.CompleteTask(r.Context(), taskID, resultJSON, comment); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publishTaskEvent(r, taskID, "task:completed")
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) failTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	taskID := getStr(in, "task_id")
	if taskID == "" {
		writeJSON(w, 400, map[string]string{"error": "task_id is required"})
		return
	}
	errMsg := getStr(in, "error")
	if err := h.task.FailTask(r.Context(), taskID, errMsg); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publishTaskEvent(r, taskID, "task:failed")
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) reportMessages(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	taskID := getStr(in, "task_id")
	if taskID == "" {
		writeJSON(w, 400, map[string]string{"error": "task_id is required"})
		return
	}
	var messages []service.InboundMessage
	if raw, ok := in["messages"]; ok {
		b, _ := json.Marshal(raw)
		json.Unmarshal(b, &messages)
	}
	if err := h.task.ReportMessages(r.Context(), taskID, messages); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	task, err := h.task.Get(r.Context(), taskID)
	if err == nil && task != nil && task.IssueID != "" {
		var wsID string
		h.db.QueryRow(r.Context(), `SELECT workspace_id FROM issues WHERE id = $1`, task.IssueID).Scan(&wsID)
		if wsID != "" {
			h.publisher.PublishWorkspace(r.Context(), wsID, "task:message", map[string]interface{}{
				"task_id": taskID,
				"count":   len(messages),
			})
		}
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) publishTaskEvent(r *http.Request, taskID, eventType string) {
	task, err := h.task.Get(r.Context(), taskID)
	if err != nil || task == nil {
		log.Printf("[publishTaskEvent] failed to get task %s: %v", taskID, err)
		return
	}
	var wsID string
	if task.IssueID != "" {
		if err := h.db.QueryRow(r.Context(), `SELECT workspace_id FROM issues WHERE id = $1`, task.IssueID).Scan(&wsID); err != nil {
			log.Printf("[publishTaskEvent] failed to get workspace for issue %s: %v", task.IssueID, err)
		}
	}
	if wsID == "" {
		log.Printf("[publishTaskEvent] skipping event %s for task %s: no workspace_id", eventType, taskID)
		return
	}
	h.publisher.PublishWorkspace(r.Context(), wsID, eventType, map[string]interface{}{
		"task_id":  taskID,
		"status":   task.Status,
		"agent_id": task.AgentID,
		"issue_id": task.IssueID,
	})
}

var (
	embeddedDaemons   = map[string]*daemon.EmbeddedDaemon{}
	embeddedDaemonsMu sync.Mutex
)

func (h *Handler) startEmbeddedDaemon(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	if wsID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}

	embeddedDaemonsMu.Lock()
	defer embeddedDaemonsMu.Unlock()

	if ed, ok := embeddedDaemons[wsID]; ok && ed.IsRunning() {
		writeJSON(w, 409, map[string]string{"error": "embedded daemon already running for this workspace"})
		return
	}

	ed := daemon.NewEmbeddedDaemon(daemon.EmbeddedConfig{
		WorkspaceID:   wsID,
		Provider:      getStr(in, "provider"),
		AgentPath:     getStr(in, "agent_path"),
		MaxConcurrent: getInt(in, "max_concurrent"),
	}, h.task, h.daemon)

	if err := ed.Start(); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}

	embeddedDaemons[wsID] = ed
	writeJSON(w, 201, ed.Status())
}

func (h *Handler) stopEmbeddedDaemon(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	if wsID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}

	embeddedDaemonsMu.Lock()
	defer embeddedDaemonsMu.Unlock()

	ed, ok := embeddedDaemons[wsID]
	if !ok || !ed.IsRunning() {
		writeJSON(w, 404, map[string]string{"error": "no embedded daemon running for this workspace"})
		return
	}

	ed.Stop()
	delete(embeddedDaemons, wsID)
	writeJSON(w, 200, map[string]string{"status": "stopped"})
}

func (h *Handler) getEmbeddedDaemonStatus(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")

	embeddedDaemonsMu.Lock()
	defer embeddedDaemonsMu.Unlock()

	if wsID != "" {
		ed, ok := embeddedDaemons[wsID]
		if !ok || !ed.IsRunning() {
			writeJSON(w, 200, map[string]interface{}{"running": false, "workspace_id": wsID})
			return
		}
		writeJSON(w, 200, ed.Status())
		return
	}

	all := make(map[string]interface{})
	for id, ed := range embeddedDaemons {
		if ed.IsRunning() {
			all[id] = ed.Status()
		}
	}
	writeJSON(w, 200, map[string]interface{}{"daemons": all})
}

func (h *Handler) cancelTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	taskID := getStr(in, "task_id")
	if taskID == "" {
		writeJSON(w, 400, map[string]string{"error": "task_id is required"})
		return
	}
	if err := h.task.CancelTask(r.Context(), taskID); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publishTaskEvent(r, taskID, "task:cancelled")
	writeJSON(w, 200, map[string]string{"status": "cancelled"})
}
