package connectapi

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
	"github.com/openzoo-ai/openzoo/server/internal/database"
)

func TestAuthRoutesArePublic(t *testing.T) {
	ctx := context.Background()
	dsn := "postgres://openzoo:openzoo@localhost:5432/openzoo?sslmode=disable"
	probe, err := pgxpool.New(ctx, dsn)
	if err != nil || probe.Ping(ctx) != nil {
		// database.Pool() log.Fatal's if it cannot connect; skip safely.
		return
	}
	probe.Close()

	t.Setenv("DATABASE_URL", dsn)

	r := chiRouterForTest(t)
	srv := httptest.NewServer(r)
	defer srv.Close()

	do := func(path string, body any) *http.Response {
		b, _ := json.Marshal(body)
		req, _ := http.NewRequest(http.MethodPost, srv.URL+path, bytes.NewReader(b))
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("request %s: %v", path, err)
		}
		return resp
	}

	resp := do("/rpc/auth/send-code", map[string]any{"email": "a@b.com"})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("send-code expected 200, got %d", resp.StatusCode)
	}
	resp.Body.Close()

	resp = do("/rpc/auth/verify-code", map[string]any{"email": "a@b.com", "code": "123456"})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("verify-code expected 200, got %d", resp.StatusCode)
	}
	resp.Body.Close()

	token, _ := auth.GenerateToken("u-a@b.com", "a@b.com")
	resp = do("/rpc/auth/login", map[string]any{"token": token})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login expected 200, got %d", resp.StatusCode)
	}
	resp.Body.Close()
}

func chiRouterForTest(t *testing.T) http.Handler {
	t.Helper()
	// We rely on the same router wiring as production for this test.
	// If DATABASE_URL points to an unreachable DB, the server package should be tested instead.
	db := database.Pool()
	r := chi.NewRouter()
	RegisterConnectRPC(r, db)
	return r
}

