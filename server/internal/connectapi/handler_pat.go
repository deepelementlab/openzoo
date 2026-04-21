package connectapi

import (
	"net/http"
	"time"
)

func (h *Handler) listPATs(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := getStr(in, "user_id")
	if userID == "" {
		writeJSON(w, 400, map[string]string{"error": "user_id required"})
		return
	}
	pats, err := h.pat.List(r.Context(), userID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"tokens": pats})
}

func (h *Handler) createPAT(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := getStr(in, "user_id")
	name := getStr(in, "name")
	if userID == "" || name == "" {
		writeJSON(w, 400, map[string]string{"error": "user_id and name required"})
		return
	}

	expiryStr := getStr(in, "expires_at")
	var expiresAt time.Time
	if expiryStr != "" {
		var err error
		expiresAt, err = time.Parse(time.RFC3339, expiryStr)
		if err != nil {
			writeJSON(w, 400, map[string]string{"error": "invalid expires_at format"})
			return
		}
	} else {
		expiresAt = time.Now().AddDate(1, 0, 0)
	}

	scopes := []string{"read", "write"}
	if s, ok := in["scopes"].([]interface{}); ok {
		scopes = make([]string, len(s))
		for i, v := range s {
			if str, ok := v.(string); ok {
				scopes[i] = str
			}
		}
	}

	pat, rawToken, err := h.pat.Create(r.Context(), userID, name, scopes, expiresAt)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 201, map[string]interface{}{
		"token": rawToken,
		"pat":   pat,
	})
}

func (h *Handler) deletePAT(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	userID := getStr(in, "user_id")
	patID := getStr(in, "pat_id")
	if userID == "" || patID == "" {
		writeJSON(w, 400, map[string]string{"error": "user_id and pat_id required"})
		return
	}
	err := h.pat.Delete(r.Context(), userID, patID)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
