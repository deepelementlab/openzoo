package connectapi

import "net/http"

func (h *Handler) listPins(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	pins, err := h.workspace.ListPins(ws)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"pins": pins})
}

func (h *Handler) createPin(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	entityType := getStr(in, "entity_type")
	entityID := getStr(in, "entity_id")
	pin, err := h.workspace.CreatePin(ws, entityType, entityID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "pin:created", pin)
	writeJSON(w, 201, pin)
}

func (h *Handler) deletePin(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	pinID := getStr(in, "pin_id")
	err := h.workspace.DeletePin(ws, pinID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	h.publisher.PublishWorkspace(r.Context(), ws, "pin:deleted", map[string]string{"pin_id": pinID})
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (h *Handler) reorderPins(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	ws := getStr(in, "workspace_id")
	
	positions := map[string]float64{}
	if items, ok := in["positions"].([]interface{}); ok {
		for _, item := range items {
			if m, ok := item.(map[string]interface{}); ok {
				id := getStr(m, "entity_id")
				pos := getFloat(m, "position")
				if id != "" {
					positions[id] = pos
				}
			}
		}
	}

	err := h.workspace.ReorderPins(ws, positions)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func getFloat(m map[string]interface{}, key string) float64 {
	v, _ := m[key].(float64)
	return v
}
