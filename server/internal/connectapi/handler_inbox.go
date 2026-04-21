package connectapi
import (
	"net/http"
	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)
func (h *Handler) listInbox(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := middleware.UserIDFromContext(r.Context())
	items, total, unread, err := h.inbox.List(r.Context(), getStr(in, "workspace_id"), userID, false, getInt(in, "limit"), getInt(in, "offset"))
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]interface{}{"items": items, "total": total, "unread_count": unread})
}
func (h *Handler) markInboxRead(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	var ids []string
	if arr, ok := in["item_ids"].([]interface{}); ok {
		for _, v := range arr { if s, ok := v.(string); ok { ids = append(ids, s) } }
	}
	err := h.inbox.MarkRead(r.Context(), getStr(in, "workspace_id"), ids)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
func (h *Handler) markInboxArchived(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	var ids []string
	if arr, ok := in["item_ids"].([]interface{}); ok {
		for _, v := range arr { if s, ok := v.(string); ok { ids = append(ids, s) } }
	}
	err := h.inbox.MarkArchived(r.Context(), getStr(in, "workspace_id"), ids)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
func (h *Handler) markAllInboxRead(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := middleware.UserIDFromContext(r.Context())
	err := h.inbox.MarkAllRead(r.Context(), getStr(in, "workspace_id"), userID)
	if err != nil { writeJSON(w, 500, map[string]string{"error": err.Error()}); return }
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
