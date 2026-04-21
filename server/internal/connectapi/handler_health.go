package connectapi

import (
	"net/http"
	"time"
)

func (h *Handler) healthCheck(w http.ResponseWriter, r *http.Request) {
	if err := h.db.Ping(r.Context()); err != nil {
		writeJSON(w, 503, map[string]interface{}{
			"status":    "unhealthy",
			"database":  "down",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
		return
	}
	writeJSON(w, 200, map[string]interface{}{
		"status":    "healthy",
		"database":  "up",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}
