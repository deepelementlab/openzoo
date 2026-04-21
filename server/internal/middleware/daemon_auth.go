package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
)

type daemonCtxKey int

const (
	daemonCtxKeyWS daemonCtxKey = iota
	daemonCtxKeyID
)

func DaemonWorkspaceIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(daemonCtxKeyWS).(string)
	return id
}

func DaemonIDFromContext(ctx context.Context) string {
	id, _ := ctx.Value(daemonCtxKeyID).(string)
	return id
}

func DaemonAuth(db daemonTokenLookup) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeAuthError(w, "missing authorization header")
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				writeAuthError(w, "invalid authorization format")
				return
			}

			if strings.HasPrefix(tokenString, "ozt_") {
				hash := auth.HashToken(tokenString)
				dt, err := db.GetDaemonTokenByHash(r.Context(), hash)
				if err != nil {
					writeAuthError(w, "invalid daemon token")
					return
				}
				ctx := context.WithValue(r.Context(), daemonCtxKeyWS, dt.WorkspaceID)
				ctx = context.WithValue(ctx, daemonCtxKeyID, dt.DaemonID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			if strings.HasPrefix(tokenString, "mul_") {
				hash := auth.HashToken(tokenString)
				pat, err := db.GetPATByHash(r.Context(), hash)
				if err != nil {
					writeAuthError(w, "invalid token")
					return
				}
				r.Header.Set("X-User-ID", pat.UserID)
				next.ServeHTTP(w, r)
				return
			}

			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return auth.GetJWTSecret(), nil
			})
			if err != nil || !token.Valid {
				writeAuthError(w, "invalid token")
				return
			}
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				writeAuthError(w, "invalid claims")
				return
			}
			sub, _ := claims["sub"].(string)
			if sub == "" {
				writeAuthError(w, "invalid claims")
				return
			}
			r.Header.Set("X-User-ID", sub)
			next.ServeHTTP(w, r)
		})
	}
}

func writeAuthError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"` + msg + `"}`))
}

type daemonTokenLookup interface {
	GetDaemonTokenByHash(ctx context.Context, hash string) (*DaemonTokenRecord, error)
	GetPATByHash(ctx context.Context, hash string) (*PATRecord, error)
}

type DaemonTokenRecord struct {
	ID          string
	DaemonID    string
	WorkspaceID string
}

type PATRecord struct {
	ID     string
	UserID string
}
