package middleware

import (
	"context"
	"net/http"
	"strings"

	"connectrpc.com/connect"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	EmailKey  contextKey = "email"
	WSIDKey   contextKey = "workspace_id"
)

// AuthInterceptor validates JWT tokens for Connect-RPC calls.
type AuthInterceptor struct{}

func (AuthInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		header := req.Header()
		authHeader := header.Get("Authorization")
		if authHeader == "" {
			authHeader = header.Get("Grpc-Metadata-Authorization")
		}
		if authHeader != "" {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := auth.ValidateToken(tokenStr)
			if err == nil {
				ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
				ctx = context.WithValue(ctx, EmailKey, claims.Email)
			}
		}
		// Extract workspace ID from header
		wsID := header.Get("X-Workspace-Id")
		if wsID != "" {
			ctx = context.WithValue(ctx, WSIDKey, wsID)
		}
		return next(ctx, req)
	}
}

func (AuthInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (AuthInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}

// UserIDFromContext extracts authenticated user ID.
func UserIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(UserIDKey).(string)
	return v
}

// EmailFromContext extracts authenticated email.
func EmailFromContext(ctx context.Context) string {
	v, _ := ctx.Value(EmailKey).(string)
	return v
}

// WorkspaceIDFromContext extracts workspace ID.
func WorkspaceIDFromContext(ctx context.Context) string {
	v, _ := ctx.Value(WSIDKey).(string)
	return v
}

// RequireAuth HTTP middleware redirects unauthenticated requests.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := auth.ValidateToken(tokenStr)
		if err != nil {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, EmailKey, claims.Email)
		wsID := r.Header.Get("X-Workspace-Id")
		if wsID != "" {
			ctx = context.WithValue(ctx, WSIDKey, wsID)
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
