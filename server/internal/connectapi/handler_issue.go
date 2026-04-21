package connectapi

import (
	"encoding/json"
	"net/http"
)
func (h *Handler) listIssues(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	issues, total, err := h.issue.List(r.Context(), ws, getInt(in, "limit"), getInt(in, "offset"), getStr(in, "status"), getStr(in, "priority"), getStr(in, "assignee_id"), false)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"issues": issues, "total": total})
}
func (h *Handler) getIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	iss, err := h.issue.Get(r.Context(), getStr(in, "workspace_id"), getStr(in, "issue_id"))
	if err != nil { writeJSON(w, 404, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, iss)
}
func (h *Handler) createIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	extra := make(map[string]interface{})
	for _, k := range []string{"assignee_type", "assignee_id", "project_id", "due_date"} {
		if v, ok := in[k]; ok {
			extra[k] = v
		}
	}
	iss, err := h.issue.Create(r.Context(), ws, getStr(in, "title"), getStr(in, "description"), getStr(in, "status"), getStr(in, "priority"), extra)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	if at, _ := extra["assignee_type"].(string); at == "agent" {
		if aid, _ := extra["assignee_id"].(string); aid != "" {
			h.task.Create(r.Context(), iss.ID, "", aid, iss.Title)
		}
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "issue:created", iss)
	writeJSON(w, 201, iss)
}
func (h *Handler) updateIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	fields := make(map[string]interface{})
	for k, v := range in { if k != "workspace_id" && k != "issue_id" { fields[k] = v } }
	ws := getStr(in, "workspace_id")
	iss, err := h.issue.Update(r.Context(), ws, getStr(in, "issue_id"), fields)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "issue:updated", iss)
	writeJSON(w, 200, iss)
}
func (h *Handler) deleteIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	err := h.issue.Delete(r.Context(), ws, getStr(in, "issue_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "issue:deleted", map[string]string{"issue_id": getStr(in, "issue_id")})
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
func (h *Handler) searchIssues(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	query := getStr(in, "query")
	if ws == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	if query == "" {
		issues, total, err := h.issue.List(r.Context(), ws, getInt(in, "limit"), 0, "", "", "", false)
		if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
		writeJSON(w, 200, map[string]interface{}{"results": issues, "total": total})
		return
	}
	issues, total, err := h.issue.Search(r.Context(), ws, query, getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"results": issues, "total": total})
}

func (h *Handler) batchUpdateIssues(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	if ws == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id is required"})
		return
	}
	var issueIDs []string
	if raw, ok := in["issue_ids"]; ok {
		b, _ := json.Marshal(raw)
		json.Unmarshal(b, &issueIDs)
	}
	if len(issueIDs) == 0 {
		writeJSON(w, 400, map[string]string{"error": "issue_ids is required"})
		return
	}
	fields := make(map[string]interface{})
	for k, v := range in {
		if k != "workspace_id" && k != "issue_ids" {
			fields[k] = v
		}
	}
	issues, err := h.issue.BatchUpdate(r.Context(), ws, issueIDs, fields)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	for _, iss := range issues {
		h.publisher.PublishWorkspace(r.Context(), ws, "issue:updated", iss)
	}
	writeJSON(w, 200, map[string]interface{}{"issues": issues, "updated": len(issues)})
}
