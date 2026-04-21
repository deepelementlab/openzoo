package middleware

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type roleContextKey string

const RoleKey roleContextKey = "role"

func RequireWorkspaceMember(db *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID := UserIDFromContext(r.Context())
			if userID == "" {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}
			wsID := r.URL.Query().Get("workspace_id")
			if wsID == "" {
				wsID = r.Header.Get("X-Workspace-Id")
			}
			if wsID == "" {
				next.ServeHTTP(w, r)
				return
			}
			var role string
			err := db.QueryRow(r.Context(),
				`SELECT role FROM members WHERE workspace_id = $1 AND user_id = $2`,
				wsID, userID).Scan(&role)
			if err != nil {
				http.Error(w, `{"error":"forbidden: not a workspace member"}`, http.StatusForbidden)
				return
			}
			ctx := context.WithValue(r.Context(), RoleKey, role)
			ctx = context.WithValue(ctx, WSIDKey, wsID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(minRole string) func(http.Handler) http.Handler {
	roleOrder := map[string]int{"owner": 3, "admin": 2, "member": 1}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, _ := r.Context().Value(RoleKey).(string)
			if role == "" {
				next.ServeHTTP(w, r)
				return
			}
			currentLevel, ok := roleOrder[role]
			if !ok {
				http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
				return
			}
			minLevel, ok := roleOrder[minRole]
			if !ok || currentLevel < minLevel {
				http.Error(w, `{"error":"forbidden: insufficient permissions"}`, http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RoleFromContext(ctx context.Context) string {
	v, _ := ctx.Value(RoleKey).(string)
	return v
}
