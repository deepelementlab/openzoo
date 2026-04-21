package connectapi
import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/middleware"
	"github.com/openzoo-ai/openzoo/server/internal/service"
)
func (h *Handler) listWorkspaces(w http.ResponseWriter, r *http.Request) {
	ws, err := h.workspace.List(r.Context())
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"workspaces": ws})
}
func (h *Handler) getWorkspace(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws, err := h.workspace.Get(r.Context(), getStr(in, "workspace_id"))
	if err != nil { writeJSON(w, 404, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, ws)
}
func (h *Handler) createWorkspace(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws, err := h.workspace.Create(r.Context(), getStr(in, "name"), getStr(in, "description"), getStr(in, "issue_prefix"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	userID := middleware.UserIDFromContext(r.Context())
	if userID != "" {
		_, _ = service.CreateMember(r.Context(), ws.ID, middleware.EmailFromContext(r.Context()), "owner")
	}
	h.publisher.PublishWorkspace(r.Context(), ws.ID, "workspace:created", ws)
	writeJSON(w, 201, ws)
}
func (h *Handler) updateWorkspace(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	var name, desc, ctx *string
	if v, ok := in["name"].(string); ok { name = &v }
	if v, ok := in["description"].(string); ok { desc = &v }
	if v, ok := in["context"].(string); ok { ctx = &v }
	ws, err := h.workspace.Update(r.Context(), getStr(in, "workspace_id"), name, desc, ctx)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	h.publisher.PublishWorkspace(r.Context(), ws.ID, "workspace:updated", ws)
	writeJSON(w, 200, ws)
}
func (h *Handler) deleteWorkspace(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	err := h.workspace.Delete(r.Context(), getStr(in, "workspace_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) listRepos(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	repos, err := h.workspace.ListRepos(r.Context(), getStr(in, "workspace_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	if repos == nil { repos = []service.WorkspaceRepo{} }
	writeJSON(w, 200, map[string]interface{}{"repos": repos})
}

func (h *Handler) addRepo(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	repo, err := h.workspace.AddRepo(r.Context(), getStr(in, "workspace_id"), getStr(in, "url"), getStr(in, "branch"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 201, repo)
}

func (h *Handler) removeRepo(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	err := h.workspace.RemoveRepo(r.Context(), getStr(in, "workspace_id"), getStr(in, "repo_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) syncRepo(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	err := h.workspace.SyncRepo(r.Context(), getStr(in, "workspace_id"), getStr(in, "repo_id"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
