package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) listIssueSubscribers(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	subs, err := service.ListIssueSubscribers(h.db, getStr(in, "workspace_id"), getStr(in, "issue_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"subscribers": subs})
}

func (h *Handler) subscribeIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	sub, err := service.SubscribeIssue(h.db, ws, getStr(in, "issue_id"), getStr(in, "user_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, sub)
}

func (h *Handler) unsubscribeIssue(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	err := service.UnsubscribeIssue(h.db, getStr(in, "workspace_id"), getStr(in, "issue_id"), getStr(in, "user_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) listIssueReactions(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	reactions, err := service.ListIssueReactions(h.db, getStr(in, "workspace_id"), getStr(in, "issue_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"reactions": reactions})
}

func (h *Handler) addIssueReaction(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	reaction, err := service.AddIssueReaction(h.db, ws, getStr(in, "issue_id"), getStr(in, "emoji"), getStr(in, "actor_type"), getStr(in, "actor_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "reaction:added", reaction)
	writeJSON(w, 201, reaction)
}

func (h *Handler) removeIssueReaction(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	err := service.RemoveIssueReaction(h.db, ws, getStr(in, "issue_id"), getStr(in, "emoji"), getStr(in, "actor_type"), getStr(in, "actor_id"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "reaction:removed", map[string]string{
		"issue_id": getStr(in, "issue_id"), "emoji": getStr(in, "emoji"),
	})
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
