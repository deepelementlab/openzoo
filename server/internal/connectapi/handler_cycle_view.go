package connectapi

import (
	"encoding/json"
	"net/http"
)

func (h *Handler) listCycles(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	workspaceID := getStr(body, "workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "workspace_id is required"})
		return
	}

	cycles, err := h.cycle.ListCycles(r.Context(), workspaceID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"cycles": cycles})
}

func (h *Handler) getCycle(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	if cycleID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id is required"})
		return
	}

	cycle, err := h.cycle.GetCycle(r.Context(), cycleID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, cycle)
}

func (h *Handler) createCycle(w http.ResponseWriter, r *http.Request) {
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

	number, err := h.cycle.GetNextCycleNumber(r.Context(), workspaceID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	description := getStr(body, "description")
	startDate := getStr(body, "start_date")
	endDate := getStr(body, "end_date")
	autoCreateNext := false
	if v, ok := body["auto_create_next"]; ok {
		autoCreateNext = v.(bool)
	}

	cycle, err := h.cycle.CreateCycle(r.Context(), workspaceID, name, description, startDate, endDate, number, autoCreateNext)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, cycle)
}

func (h *Handler) updateCycle(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	if cycleID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id is required"})
		return
	}

	updates := map[string]any{}
	if v, ok := body["name"]; ok {
		updates["name"] = v
	}
	if v, ok := body["description"]; ok {
		updates["description"] = v
	}
	if v, ok := body["start_date"]; ok {
		updates["start_date"] = v
	}
	if v, ok := body["end_date"]; ok {
		updates["end_date"] = v
	}
	if v, ok := body["status"]; ok {
		updates["status"] = v
	}
	if v, ok := body["auto_create_next"]; ok {
		updates["auto_create_next"] = v
	}

	cycle, err := h.cycle.UpdateCycle(r.Context(), cycleID, updates)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, cycle)
}

func (h *Handler) deleteCycle(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	if cycleID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id is required"})
		return
	}

	if err := h.cycle.DeleteCycle(r.Context(), cycleID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) addIssueToCycle(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	issueID := getStr(body, "issue_id")
	if cycleID == "" || issueID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id and issue_id are required"})
		return
	}

	if err := h.cycle.AddIssueToCycle(r.Context(), cycleID, issueID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) removeIssueFromCycle(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	issueID := getStr(body, "issue_id")
	if cycleID == "" || issueID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id and issue_id are required"})
		return
	}

	if err := h.cycle.RemoveIssueFromCycle(r.Context(), cycleID, issueID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}

func (h *Handler) getCycleIssues(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	cycleID := getStr(body, "cycle_id")
	if cycleID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "cycle_id is required"})
		return
	}

	issues, err := h.cycle.GetCycleIssues(r.Context(), cycleID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"issues": issues})
}

func (h *Handler) listViews(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	workspaceID := getStr(body, "workspace_id")
	if workspaceID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "workspace_id is required"})
		return
	}

	creatorID := ""
	if v, ok := body["creator_id"]; ok {
		creatorID = v.(string)
	}

	views, err := h.view.ListViews(r.Context(), workspaceID, creatorID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"views": views})
}

func (h *Handler) getView(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	viewID := getStr(body, "view_id")
	if viewID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "view_id is required"})
		return
	}

	view, err := h.view.GetView(r.Context(), viewID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, view)
}

func (h *Handler) createView(w http.ResponseWriter, r *http.Request) {
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

	creatorID := getStr(body, "creator_id")
	description := getStr(body, "description")
	isShared := false
	if v, ok := body["is_shared"]; ok {
		isShared = v.(bool)
	}

	var filters map[string]any
	var sortOrder []any
	if v, ok := body["filters"]; ok {
		filtersJSON, _ := json.Marshal(v)
		json.Unmarshal(filtersJSON, &filters)
	}
	if v, ok := body["sort_order"]; ok {
		sortOrderJSON, _ := json.Marshal(v)
		json.Unmarshal(sortOrderJSON, &sortOrder)
	}

	view, err := h.view.CreateView(r.Context(), workspaceID, creatorID, name, description, filters, sortOrder, isShared)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, view)
}

func (h *Handler) updateView(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	viewID := getStr(body, "view_id")
	if viewID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "view_id is required"})
		return
	}

	updates := map[string]any{}
	if v, ok := body["name"]; ok {
		updates["name"] = v
	}
	if v, ok := body["description"]; ok {
		updates["description"] = v
	}
	if v, ok := body["filters"]; ok {
		updates["filters"] = v
	}
	if v, ok := body["sort_order"]; ok {
		updates["sort_order"] = v
	}
	if v, ok := body["is_shared"]; ok {
		updates["is_shared"] = v
	}

	view, err := h.view.UpdateView(r.Context(), viewID, updates)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, view)
}

func (h *Handler) deleteView(w http.ResponseWriter, r *http.Request) {
	body := readJSON(r)
	viewID := getStr(body, "view_id")
	if viewID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "view_id is required"})
		return
	}

	if err := h.view.DeleteView(r.Context(), viewID); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"success": true})
}
