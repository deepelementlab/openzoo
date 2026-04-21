package connectapi
import "net/http"
func (h *Handler) createTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	t, err := h.task.Create(r.Context(), getStr(in, "issue_id"), getStr(in, "runtime_id"), getStr(in, "agent_id"), getStr(in, "prompt"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 201, t)
}
func (h *Handler) getTask(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	t, err := h.task.Get(r.Context(), getStr(in, "task_id"))
	if err != nil { writeJSON(w, 404, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, t)
}
func (h *Handler) listTasks(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	tasks, total, err := h.task.List(r.Context(), getStr(in, "workspace_id"), getStr(in, "issue_id"), getStr(in, "agent_id"), getStr(in, "status"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"tasks": tasks, "total": total})
}
func (h *Handler) updateTaskStatus(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	var taskErr, result *string
	if v, ok := in["error"].(string); ok { taskErr = &v }
	if v, ok := in["result"].(string); ok { result = &v }
	t, err := h.task.UpdateStatus(r.Context(), getStr(in, "task_id"), getStr(in, "status"), taskErr, result)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, t)
}
func (h *Handler) listTaskMessages(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	msgs, err := h.task.ListMessages(r.Context(), getStr(in, "task_id"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"messages": msgs})
}
