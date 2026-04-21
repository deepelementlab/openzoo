package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) listActivities(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	activities, err := service.ListActivities(h.db, getStr(in, "workspace_id"), getStr(in, "issue_id"), getInt(in, "limit"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"activities": activities})
}

func (h *Handler) createActivity(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	activity, err := service.CreateActivity(h.db, ws, getStr(in, "issue_id"), getStr(in, "user_id"),
		getStr(in, "action"), getStr(in, "entity_type"), getStr(in, "entity_id"),
		getStr(in, "old_value"), getStr(in, "new_value"), nil)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "activity:created", activity)
	writeJSON(w, 201, activity)
}
