package connectapi

import (
	"net/http"
)

func (h *Handler) listLabels(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	workspaceID := getStr(body, "workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "workspace_id is required"})
		return
	}

	labels, err := h.label.ListLabels(r.Context(), workspaceID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"labels": labels})
}

func (h *Handler) createLabel(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	workspaceID := getStr(body, "workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "workspace_id is required"})
		return
	}

	name := getStr(body, "name")
	if name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "name is required"})
		return
	}

	description := getStr(body, "description")
	color := getStr(body, "color")
	if color == "" {
		color = "#6366f1"
	}

	label, err := h.label.CreateLabel(r.Context(), workspaceID, name, description, color)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, label)
}

func (h *Handler) updateLabel(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	labelID := getStr(body, "label_id")
	if labelID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "label_id is required"})
		return
	}

	updates := map[string]any{}
	if v, ok := body["name"]; ok {
		updates["name"] = v
	}
	if v, ok := body["description"]; ok {
		updates["description"] = v
	}
	if v, ok := body["color"]; ok {
		updates["color"] = v
	}

	label, err := h.label.UpdateLabel(r.Context(), labelID, updates)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, label)
}

func (h *Handler) deleteLabel(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	labelID := getStr(body, "label_id")
	if labelID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "label_id is required"})
		return
	}

	if err := h.label.DeleteLabel(r.Context(), labelID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) addIssueLabel(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	issueID := getStr(body, "issue_id")
	labelID := getStr(body, "label_id")
	if issueID == "" || labelID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "issue_id and label_id are required"})
		return
	}

	if err := h.label.AddLabelToIssue(r.Context(), issueID, labelID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) removeIssueLabel(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	issueID := getStr(body, "issue_id")
	labelID := getStr(body, "label_id")
	if issueID == "" || labelID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "issue_id and label_id are required"})
		return
	}

	if err := h.label.RemoveLabelFromIssue(r.Context(), issueID, labelID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) getIssueLabels(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	issueID := getStr(body, "issue_id")
	if issueID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "issue_id is required"})
		return
	}

	labels, err := h.label.GetIssueLabels(r.Context(), issueID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"labels": labels})
}
