package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
)

func makeToken(t *testing.T, claims auth.Claims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := token.SignedString([]byte("openzoo-dev-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return s
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	handler := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/rpc/auth/me", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	handler := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called")
	}))

	req := httptest.NewRequest(http.MethodGet, "/rpc/auth/me", nil)
	req.Header.Set("Authorization", "Bearer not-a-valid-token")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
}

func TestRequireAuth_ValidToken(t *testing.T) {
	var gotUserID, gotEmail, gotWS string
	handler := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUserID = UserIDFromContext(r.Context())
		gotEmail = EmailFromContext(r.Context())
		gotWS = WorkspaceIDFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	token := makeToken(t, auth.Claims{
		UserID: "user-1",
		Email:  "user@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "openzoo",
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/rpc/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("X-Workspace-Id", "ws-1")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if gotUserID != "user-1" || gotEmail != "user@example.com" || gotWS != "ws-1" {
		t.Fatalf("unexpected context values: user=%q email=%q ws=%q", gotUserID, gotEmail, gotWS)
	}
}
