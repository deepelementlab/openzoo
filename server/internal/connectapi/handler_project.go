package connectapi

import (
	"net/http"
	"strings"

	"github.com/openzoo-ai/openzoo/server/internal/service"
)
func (h *Handler) listProjects(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	projects, total, err := h.project.List(r.Context(), getStr(in, "workspace_id"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"projects": projects, "total": total})
}
func (h *Handler) createProject(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	p, err := h.project.Create(r.Context(), ws, getStr(in, "title"), getStr(in, "description"), getStr(in, "icon"), getStr(in, "status"), getStr(in, "priority"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "project:created", p)
	writeJSON(w, 201, p)
}
func (h *Handler) updateProject(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	fields := make(map[string]interface{})
	for k, v := range in { if k != "workspace_id" && k != "project_id" { fields[k] = v } }
	p, err := h.project.Update(r.Context(), getStr(in, "workspace_id"), getStr(in, "project_id"), fields)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, p)
}
func (h *Handler) deleteProject(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	err := h.project.Delete(r.Context(), ws, getStr(in, "project_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws, "project:deleted", map[string]string{"project_id": getStr(in, "project_id")})
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) searchProjects(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	query := strings.ToLower(strings.TrimSpace(getStr(in, "query")))
	projects, _, err := h.project.List(r.Context(), getStr(in, "workspace_id"), getInt(in, "limit"), 0)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	if query == "" {
		writeJSON(w, 200, map[string]interface{}{"results": projects, "total": len(projects)})
		return
	}
	filtered := make([]service.Project, 0, len(projects))
	for _, p := range projects {
		title := strings.ToLower(p.Title)
		desc := strings.ToLower(p.Description)
		if strings.Contains(title, query) || strings.Contains(desc, query) {
			filtered = append(filtered, p)
		}
	}
	writeJSON(w, 200, map[string]interface{}{"results": filtered, "total": len(filtered)})
}

func (h *Handler) listMembers(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	members, err := service.ListMembers(r.Context(), getStr(in, "workspace_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"members": members})
}

func (h *Handler) createMember(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	member, err := service.CreateMember(r.Context(), getStr(in, "workspace_id"), getStr(in, "email"), getStr(in, "role"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, member)
}

func (h *Handler) updateMember(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	member, err := service.UpdateMember(r.Context(), getStr(in, "workspace_id"), getStr(in, "member_id"), getStr(in, "role"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, member)
}

func (h *Handler) deleteMember(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	if err := service.DeleteMember(r.Context(), getStr(in, "workspace_id"), getStr(in, "member_id")); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
