package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)

func (h *Handler) canManageAgent(r *http.Request, wsID, agentOwnerID string) bool {
	userID := middleware.UserIDFromContext(r.Context())
	if userID == "" {
		return false
	}
	role := middleware.RoleFromContext(r.Context())
	if role == "owner" || role == "admin" {
		return true
	}
	return agentOwnerID == userID
}

func (h *Handler) checkAgentPermission(w http.ResponseWriter, r *http.Request, wsID, agentID string) bool {
	a, err := h.agent.Get(r.Context(), wsID, agentID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "agent not found"})
		return false
	}
	if !h.canManageAgent(r, wsID, a.OwnerID) {
		writeJSON(w, 403, map[string]string{"error": "forbidden: insufficient permissions"})
		return false
	}
	return true
}

func (h *Handler) listAgents(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	if ws == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	agents, err := h.agent.List(r.Context(), ws)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"agents": agents})
}
func (h *Handler) getAgent(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	if ws == "" || agentID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and agent_id are required"})
		return
	}
	a, err := h.agent.Get(r.Context(), ws, agentID)
	if err != nil { writeJSON(w, 404, map[string]string{"error": "agent not found"}); return }
	writeJSON(w, 200, a)
}
func (h *Handler) createAgent(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	name := getStr(in, "name")
	if ws == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	if name == "" {
		writeJSON(w, 400, map[string]string{"error": "name is required"})
		return
	}
	userID := middleware.UserIDFromContext(r.Context())
	a, err := h.agent.CreateWithOwner(r.Context(), ws, name, getStr(in, "description"), getStr(in, "instructions"), getStr(in, "runtime_id"), userID)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "agent:created", a)
	writeJSON(w, 201, a)
}
func (h *Handler) updateAgent(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	if !h.checkAgentPermission(w, r, ws, agentID) {
		return
	}
	fields := make(map[string]interface{})
	for k, v := range in {
		if k != "workspace_id" && k != "agent_id" && k != "owner_id" {
			fields[k] = v
		}
	}
	a, err := h.agent.Update(r.Context(), ws, agentID, fields)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "agent:updated", a)
	writeJSON(w, 200, a)
}
func (h *Handler) archiveAgent(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	if !h.checkAgentPermission(w, r, ws, agentID) {
		return
	}
	userID := middleware.UserIDFromContext(r.Context())
	a, err := h.agent.Archive(r.Context(), ws, agentID, userID)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	_, _ = h.task.CancelTasksByAgent(r.Context(), agentID)
	h.publisher.PublishWorkspace(r.Context(), ws, "agent:archived", a)
	writeJSON(w, 200, a)
}
func (h *Handler) restoreAgent(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	if !h.checkAgentPermission(w, r, ws, agentID) {
		return
	}
	a, err := h.agent.Restore(r.Context(), ws, agentID)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "agent:restored", a)
	writeJSON(w, 200, a)
}
func (h *Handler) listRuntimes(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	runtimes, err := h.runtime.List(r.Context(), getStr(in, "workspace_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"runtimes": runtimes})
}
func (h *Handler) registerRuntime(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	rt, err := h.runtime.Register(r.Context(), ws, getStr(in, "name"), getStr(in, "provider"), getStr(in, "runtime_mode"), getStr(in, "device_info"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "runtime:registered", rt)
	writeJSON(w, 201, rt)
}
