package connectapi

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/openzoo-ai/openzoo/server/internal/daemon/discovery"
	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) discoverExternalSessions(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	if wsID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}

	processes, err := discovery.ScanClaudeProcesses(r.Context())
	if err != nil {
		log.Printf("[discoverExternal] process scan error: %v", err)
	}

	sessions, err := discovery.ScanClaudeSessions(r.Context())
	if err != nil {
		log.Printf("[discoverExternal] session scan error: %v", err)
	}

	matched := discovery.MatchProcessesWithSessions(processes, sessions)

	discovered := make([]map[string]interface{}, 0, len(matched))
	for _, m := range matched {
		input := map[string]interface{}{
			"workspace_id":      wsID,
			"session_id":        m.Session.SessionID,
			"pid":               m.Process.PID,
			"process_cwd":       m.Process.Cwd,
			"session_file_path": m.Session.SessionFilePath,
		}
		meta, _ := json.Marshal(map[string]interface{}{
			"confidence":    m.Confidence,
			"claude_path":   m.Process.ExecPath,
			"model":         m.Session.Model,
			"last_modified": m.Session.LastModified,
		})
		regInput := registerInputFromMap(input, meta)

		es, err := h.externalSession.UpsertByPID(r.Context(), regInput)
		if err != nil {
			log.Printf("[discoverExternal] upsert session pid=%d: %v", m.Process.PID, err)
			continue
		}
		discovered = append(discovered, map[string]interface{}{
			"id":          es.ID,
			"session_id":  es.SessionID,
			"pid":         es.PID,
			"process_cwd": es.ProcessCwd,
			"status":      es.Status,
			"confidence":  m.Confidence,
		})
	}

	writeJSON(w, 200, map[string]interface{}{
		"discovered":  discovered,
		"total":       len(discovered),
		"processes":   len(processes),
		"sessions":    len(sessions),
	})
}

func (h *Handler) listExternalSessions(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	if wsID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	sessions, err := h.externalSession.ListDiscovered(r.Context(), wsID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if sessions == nil {
		sessions = []service.ExternalSession{}
	}
	writeJSON(w, 200, map[string]interface{}{"sessions": sessions})
}

func (h *Handler) monitorExternalSession(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	id := getStr(in, "id")
	if id == "" {
		writeJSON(w, 400, map[string]string{"error": "id is required"})
		return
	}
	if err := h.externalSession.MonitorSession(r.Context(), id); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "monitoring"})
}

func (h *Handler) adoptExternalSession(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	id := getStr(in, "id")
	if id == "" {
		writeJSON(w, 400, map[string]string{"error": "id is required"})
		return
	}
	agentID := getStr(in, "agent_id")
	if agentID == "" {
		writeJSON(w, 400, map[string]string{"error": "agent_id is required"})
		return
	}
	if err := h.externalSession.AdoptSession(r.Context(), id, agentID); err != nil {
		log.Printf("[adoptExternal] AdoptSession failed: %v", err)
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "adopted"})
}

func (h *Handler) releaseExternalSession(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	id := getStr(in, "id")
	if id == "" {
		writeJSON(w, 400, map[string]string{"error": "id is required"})
		return
	}
	if err := h.externalSession.ReleaseSession(r.Context(), id); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "released"})
}

func (h *Handler) streamExternalSession(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	id := getStr(in, "id")
	if id == "" {
		writeJSON(w, 400, map[string]string{"error": "id is required"})
		return
	}

	es, err := h.externalSession.Get(r.Context(), id)
	if err != nil {
		log.Printf("[streamExternal] Get failed for id=%s: %v", id, err)
		writeJSON(w, 500, map[string]string{"error": "session lookup failed: " + err.Error()})
		return
	}
	log.Printf("[streamExternal] found session id=%s path=%s", id, es.SessionFilePath)

	if es.SessionFilePath == "" {
		writeJSON(w, 400, map[string]string{"error": "session has no file path"})
		return
	}

	filePath := es.SessionFilePath
	if _, err := os.Stat(filePath); err != nil {
		log.Printf("[streamExternal] file stat failed path=%s: %v", filePath, err)
		writeJSON(w, 500, map[string]string{"error": "session file not accessible: " + err.Error()})
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(200)

	fmt.Fprintf(w, "event: connected\ndata: {\"session_id\":%q}\n\n", es.SessionID)

	f, err := os.Open(filePath)
	if err != nil {
		fmt.Fprintf(w, "event: error\ndata: {\"error\":\"%s\"}\n\n", err.Error())
		return
	}
	defer f.Close()

	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	lineCount := 0
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		lineCount++
		fmt.Fprintf(w, "data: %s\n\n", line)
		if lineCount%10 == 0 {
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}
		}
	}
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
	fmt.Fprintf(w, "event: end\ndata: {\"lines\":%d}\n\n", lineCount)
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}

func tailSessionFile(ctx interface{ Done() <-chan struct{} }, filePath string, out chan<- map[string]interface{}) {
	defer close(out)

	f, err := os.Open(filePath)
	if err != nil {
		out <- map[string]interface{}{"type": "error", "error": err.Error()}
		return
	}
	defer f.Close()

	buf := make([]byte, 4096)
	var lineBuf strings.Builder

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		n, err := f.Read(buf)
		if n > 0 {
			chunk := string(buf[:n])
			for _, line := range strings.Split(chunk, "\n") {
				line = strings.TrimSpace(line)
				if line == "" {
					continue
				}
				lineBuf.WriteString(line)
				if !strings.HasSuffix(chunk, "\n") {
					continue
				}
				completeLine := lineBuf.String()
				lineBuf.Reset()

				var evt map[string]interface{}
				if json.Unmarshal([]byte(completeLine), &evt) == nil {
					out <- evt
				}
			}
		}
		if err != nil {
			time.Sleep(500 * time.Millisecond)
			stat, statErr := os.Stat(filePath)
			if statErr != nil {
				out <- map[string]interface{}{"type": "error", "error": "file disappeared"}
				return
			}
			info, _ := f.Stat()
			if info != nil && stat.Size() < info.Size() {
				f.Seek(0, 0)
			}
			continue
		}
	}
}

func registerInputFromMap(m map[string]interface{}, metadata json.RawMessage) service.RegisterExternalSessionInput {
	homeDir, _ := os.UserHomeDir()
	sessionFilePath, _ := m["session_file_path"].(string)
	if sessionFilePath == "" {
		sessionID, _ := m["session_id"].(string)
		if sessionID != "" && homeDir != "" {
			sessionFilePath = filepath.Join(homeDir, ".claude", "projects", "*", "sessions", sessionID+".jsonl")
		}
	}
	pid := 0
	if v, ok := m["pid"].(float64); ok {
		pid = int(v)
	}
	return service.RegisterExternalSessionInput{
		WorkspaceID:     m["workspace_id"].(string),
		SessionID:       m["session_id"].(string),
		PID:             pid,
		ProcessCwd:      m["process_cwd"].(string),
		SessionFilePath: sessionFilePath,
		Metadata:        metadata,
	}
}
