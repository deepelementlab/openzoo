package connectapi

import (
	"net/http"

	"github.com/openzoo-ai/openzoo/server/internal/middleware"
	"github.com/openzoo-ai/openzoo/server/internal/service"
)

func (h *Handler) sendVerificationCode(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	email := getStr(in, "email")
	if email == "" {
		writeJSON(w, 400, map[string]string{"error": "email is required"})
		return
	}
	if err := service.SendVerificationCode(r.Context(), email); err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]bool{"success": true})
}

func (h *Handler) verifyCode(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	email := getStr(in, "email")
	code := getStr(in, "code")
	if email == "" || code == "" {
		writeJSON(w, 400, map[string]string{"error": "email and code are required"})
		return
	}
	token, user, err := service.VerifyCode(r.Context(), email, code)
	if err != nil {
		writeJSON(w, 401, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"token": token, "user": user})
}

func (h *Handler) loginWithToken(w http.ResponseWriter, r *http.Request) {
	in := readJSON(r)
	tokenStr := getStr(in, "token")
	if tokenStr == "" {
		writeJSON(w, 400, map[string]string{"error": "token is required"})
		return
	}
	token, user, err := service.LoginWithToken(r.Context(), tokenStr)
	if err != nil {
		writeJSON(w, 401, map[string]string{"error": "invalid token"})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"token": token, "user": user})
}

func (h *Handler) getCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	if userID == "" {
		writeJSON(w, 401, map[string]string{"error": "unauthorized"})
		return
	}
	user, err := service.GetUserByID(r.Context(), userID)
	if err != nil {
		writeJSON(w, 404, map[string]string{"error": "user not found"})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"user": user})
}

func (h *Handler) updateCurrentUser(w http.ResponseWriter, r *http.Request) {
	userID := middleware.UserIDFromContext(r.Context())
	if userID == "" {
		writeJSON(w, 401, map[string]string{"error": "unauthorized"})
		return
	}
	in := readJSON(r)
	fields := make(map[string]interface{})
	if name, ok := in["name"].(string); ok && name != "" {
		fields["name"] = name
	}
	if avatarURL, ok := in["avatar_url"].(string); ok {
		fields["avatar_url"] = avatarURL
	}
	if len(fields) == 0 {
		writeJSON(w, 400, map[string]string{"error": "no fields to update"})
		return
	}
	user, err := service.UpdateUser(r.Context(), userID, fields)
	if err != nil {
		writeJSON(w, 500, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]interface{}{"user": user})
}
