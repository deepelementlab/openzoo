package connectapi
import (
	"net/http"
	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)
func (h *Handler) listChatSessions(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	sessions, err := h.chat.ListSessions(r.Context(), getStr(in, "workspace_id"), getStr(in, "agent_id"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"sessions": sessions})
}
func (h *Handler) createChatSession(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := middleware.UserIDFromContext(r.Context())
	if userID == "" { userID = "anonymous" }
	cs, err := h.chat.CreateSession(r.Context(), getStr(in, "workspace_id"), getStr(in, "agent_id"), userID, getStr(in, "title"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 201, cs)
}
func (h *Handler) listChatMessages(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	msgs, err := h.chat.ListMessages(r.Context(), getStr(in, "workspace_id"), getStr(in, "session_id"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"messages": msgs})
}
func (h *Handler) sendChatMessage(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	sessionID := getStr(in, "session_id")
	content := getStr(in, "content")
	msg, err := h.chat.SendMessage(r.Context(), sessionID, "user", content)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }

	var taskID *string
	if getBool(in, "create_task") {
		session, err := h.chat.GetSession(r.Context(), sessionID)
		if err == nil && session.AgentID != "" {
			task, err := h.task.Create(r.Context(), "", "", session.AgentID, content)
			if err == nil {
				taskID = &task.ID
				h.chat.LinkTaskToMessage(r.Context(), msg.ID, task.ID)
			}
		}
	}
	writeJSON(w, 201, map[string]interface{}{"message_id": msg.ID, "task_id": taskID})
}
