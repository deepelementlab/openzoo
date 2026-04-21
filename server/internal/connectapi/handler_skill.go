package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)

func (h *Handler) listSkills(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	skills, err := h.agent.ListSkills(r.Context(), ws)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"skills": skills})
}

func (h *Handler) createSkill(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	skill, err := h.agent.CreateSkill(r.Context(), ws, getStr(in, "name"), getStr(in, "description"), getStr(in, "content"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, skill)
}

func (h *Handler) updateSkill(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	skillID := getStr(in, "skill_id")
	fields := make(map[string]interface{})
	for k, v := range in {
		if k != "workspace_id" && k != "skill_id" {
			fields[k] = v
		}
	}
	skill, err := h.agent.UpdateSkill(r.Context(), ws, skillID, fields)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, skill)
}

func (h *Handler) deleteSkill(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	skillID := getStr(in, "skill_id")
	err := h.agent.DeleteSkill(r.Context(), ws, skillID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) setAgentSkills(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	if ws == "" || agentID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and agent_id required"})
		return
	}
	userID := middleware.UserIDFromContext(r.Context())
	agent, err := h.agent.Get(r.Context(), ws, agentID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "agent not found"})
		return
	}
	if !h.canManageAgent(r, ws, agent.OwnerID) && userID != "" {
		role := middleware.RoleFromContext(r.Context())
		if role != "owner" && role != "admin" {
			writeJSON(w, 403, map[string]string{"error": "forbidden"})
			return
		}
	}
	var skillIDs []string
	if raw, ok := in["skill_ids"]; ok {
		for _, v := range raw.([]interface{}) {
			if s, ok := v.(string); ok {
				skillIDs = append(skillIDs, s)
			}
		}
	}
	if err := h.agent.SetAgentSkills(r.Context(), ws, agentID, skillIDs); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	skills, _ := h.agent.ListAgentSkills(r.Context(), ws, agentID)
	writeJSON(w, 200, map[string]interface{}{"skills": skills})
}

func (h *Handler) listAgentSkills(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	agentID := getStr(in, "agent_id")
	skills, err := h.agent.ListAgentSkills(r.Context(), ws, agentID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"skills": skills})
}

func (h *Handler) getRuntimeDetail(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	runtimeID := getStr(in, "runtime_id")
	runtime, err := h.runtime.Get(r.Context(), ws, runtimeID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, runtime)
}

func (h *Handler) updateRuntime(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	runtimeID := getStr(in, "runtime_id")
	fields := make(map[string]interface{})
	for k, v := range in {
		if k != "workspace_id" && k != "runtime_id" {
			fields[k] = v
		}
	}
	runtime, err := h.runtime.Update(r.Context(), ws, runtimeID, fields)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, runtime)
}

func (h *Handler) deleteRuntime(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	runtimeID := getStr(in, "runtime_id")
	err := h.runtime.Delete(r.Context(), ws, runtimeID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
