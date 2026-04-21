package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) listComments(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	comments, err := service.ListComments(r.Context(), getStr(in, "workspace_id"), getStr(in, "issue_id"), getInt(in, "limit"), getInt(in, "offset"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"comments": comments})
}

func (h *Handler) createComment(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	authorID := serviceUserID(r)
	comment, err := service.CreateComment(
		r.Context(),
		getStr(in, "workspace_id"),
		getStr(in, "issue_id"),
		authorID,
		getStr(in, "content"),
		getStr(in, "parent_id"),
	)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, comment)
}

func (h *Handler) updateComment(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	comment, err := service.UpdateComment(r.Context(), getStr(in, "workspace_id"), getStr(in, "comment_id"), getStr(in, "content"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, comment)
}

func (h *Handler) deleteComment(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	if err := service.DeleteComment(r.Context(), getStr(in, "workspace_id"), getStr(in, "comment_id")); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) addCommentReaction(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	actorID := serviceUserID(r)
	reaction, err := service.AddReaction(r.Context(), getStr(in, "workspace_id"), getStr(in, "comment_id"), "member", actorID, getStr(in, "emoji"))
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, reaction)
}

func (h *Handler) removeCommentReaction(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	actorID := serviceUserID(r)
	if err := service.RemoveReaction(r.Context(), getStr(in, "workspace_id"), getStr(in, "comment_id"), "member", actorID, getStr(in, "emoji")); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

// Timeline and attachment APIs
func (h *Handler) listCommentTimeline(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	issueID := getStr(in, "issue_id")
	if wsID == "" || issueID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and issue_id are required"})
		return
	}
	limit := getInt(in, "limit")
	if limit <= 0 {
		limit = 50
	}
	comments, err := service.ListComments(r.Context(), wsID, issueID, limit, 0)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	activities, err := service.ListActivities(h.db, wsID, issueID, limit)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	type timelineEntry struct {
		ID        string      `json:"id"`
		Type      string      `json:"type"`
		Entry     interface{} `json:"entry"`
		CreatedAt interface{} `json:"created_at"`
	}
	var entries []timelineEntry
	for _, c := range comments {
		entries = append(entries, timelineEntry{ID: c.ID, Type: "comment", Entry: c, CreatedAt: c.CreatedAt})
	}
	for _, a := range activities {
		entries = append(entries, timelineEntry{ID: a.ID, Type: "activity", Entry: a, CreatedAt: a.CreatedAt})
	}
	if entries == nil {
		entries = []timelineEntry{}
	}
	writeJSON(w, 200, map[string]interface{}{"entries": entries})
}

func (h *Handler) uploadAttachment(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		writeJSON(w, 400, map[string]string{"error": "failed to parse multipart form"})
		return
	}
	wsID := r.FormValue("workspace_id")
	issueID := r.FormValue("issue_id")
	uploaderID := serviceUserID(r)
	if wsID == "" || issueID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and issue_id are required"})
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSON(w, 400, map[string]string{"error": "file is required"})
		return
	}
	defer file.Close()
	record, err := h.file.Upload(r.Context(), wsID, issueID, "", uploaderID, header.Filename, header.Header.Get("Content-Type"), header.Size, file)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, record)
}

func (h *Handler) deleteAttachment(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	wsID := getStr(in, "workspace_id")
	fileID := getStr(in, "file_id")
	if wsID == "" || fileID == "" {
		writeJSON(w, 400, map[string]string{"error": "workspace_id and file_id are required"})
		return
	}
	if err := h.file.Delete(r.Context(), wsID, fileID); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func serviceUserID(r *http.Request) string {
	in := r.Context().Value("user_id")
	if s, ok := in.(string); ok && s != "" {
		return s
	}
	return "system"
}
