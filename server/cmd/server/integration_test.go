package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
	"github.com/openzoo-ai/openzoo/server/internal/database"
)

var (
	testServer      *httptest.Server
	testPool        *pgxpool.Pool
	testToken       string
	testWorkspaceID string
	testUserID      string
)

func TestMain(m *testing.M) {
	ctx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://openzoo:openzoo@localhost:5432/openzoo?sslmode=disable"
		_ = os.Setenv("DATABASE_URL", dsn)
	}
	probe, err := pgxpool.New(ctx, dsn)
	if err != nil || probe.Ping(ctx) != nil {
		os.Exit(0)
	}
	probe.Close()
	applyMigrations(ctx)

	testPool = database.Pool()
	if err := setupFixture(ctx); err != nil {
		panic(err)
	}
	testToken, err = auth.GenerateToken(testUserID, "integration@openzoo.ai")
	if err != nil {
		panic(err)
	}

	testServer = httptest.NewServer(NewRouter())
	code := m.Run()

	testServer.Close()
	cleanupFixture(ctx)
	os.Exit(code)
}

func applyMigrations(ctx context.Context) {
	path := filepath.Join("..", "..", "migrations", "001_init.up.sql")
	content, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}
	pool := database.Pool()
	if _, err := pool.Exec(ctx, string(content)); err != nil {
		panic(err)
	}
}

func setupFixture(ctx context.Context) error {
	testUserID = "user-integration-openzoo"
	testWorkspaceID = "ws-integration-openzoo"
	_, _ = testPool.Exec(ctx, `DELETE FROM members WHERE workspace_id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM workspaces WHERE id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM users WHERE id = $1`, testUserID)

	if _, err := testPool.Exec(ctx, `INSERT INTO users (id, name, email) VALUES ($1, $2, $3)`, testUserID, "Integration User", "integration@openzoo.ai"); err != nil {
		return err
	}
	if _, err := testPool.Exec(ctx, `INSERT INTO workspaces (id, name, slug, issue_prefix) VALUES ($1, $2, $3, $4)`, testWorkspaceID, "Integration Workspace", "integration-openzoo", "IT"); err != nil {
		return err
	}
	if _, err := testPool.Exec(ctx, `INSERT INTO members (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`, "member-integration-openzoo", testWorkspaceID, testUserID); err != nil {
		return err
	}
	return nil
}

func cleanupFixture(ctx context.Context) {
	_, _ = testPool.Exec(ctx, `DELETE FROM tasks WHERE issue_id IN (SELECT id FROM issues WHERE workspace_id = $1)`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM comments WHERE workspace_id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM issues WHERE workspace_id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM members WHERE workspace_id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM workspaces WHERE id = $1`, testWorkspaceID)
	_, _ = testPool.Exec(ctx, `DELETE FROM users WHERE id = $1`, testUserID)
}

func rpcRequest(t *testing.T, route string, body any, out any) *http.Response {
	t.Helper()
	b, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, testServer.URL+route, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testToken)
	req.Header.Set("X-Workspace-Id", testWorkspaceID)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	if out != nil {
		defer resp.Body.Close()
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			t.Fatalf("decode response: %v", err)
		}
	}
	return resp
}

func TestHealth(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/health")
	if err != nil {
		t.Fatalf("health: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	if result["status"] != "ok" {
		t.Fatalf("expected status ok, got %s", result["status"])
	}
	if result["database"] != "up" {
		t.Fatalf("expected database up, got %s", result["database"])
	}
}

func TestMetrics(t *testing.T) {
	resp, err := http.Get(testServer.URL + "/metrics")
	if err != nil {
		t.Fatalf("metrics: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
}

func TestAuthPublicAndProtected(t *testing.T) {
	resp, err := http.Post(testServer.URL+"/rpc/auth/send-code", "application/json", bytes.NewReader([]byte(`{"email":"a@b.com"}`)))
	if err != nil {
		t.Fatalf("send-code: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("send-code expected 200, got %d", resp.StatusCode)
	}

	var verifyResp struct {
		Token string `json:"token"`
	}
	req, _ := http.NewRequest(http.MethodPost, testServer.URL+"/rpc/auth/verify-code", bytes.NewReader([]byte(`{"email":"a@b.com","code":"123456"}`)))
	req.Header.Set("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("verify-code: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		resp.Body.Close()
		t.Fatalf("verify-code expected 200, got %d", resp.StatusCode)
	}
	_ = json.NewDecoder(resp.Body).Decode(&verifyResp)
	resp.Body.Close()
	if verifyResp.Token == "" {
		t.Fatal("verify-code expected non-empty token")
	}

	req, _ = http.NewRequest(http.MethodPost, testServer.URL+"/rpc/workspace/list", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("workspace/list: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("workspace/list expected 401 without auth, got %d", resp.StatusCode)
	}

	req, _ = http.NewRequest(http.MethodPost, testServer.URL+"/rpc/auth/me", bytes.NewReader([]byte(`{}`)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+verifyResp.Token)
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("auth/me: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("auth/me expected 200, got %d", resp.StatusCode)
	}
}

func TestIssueAndCommentFlow(t *testing.T) {
	var issue map[string]any
	resp := rpcRequest(t, "/rpc/issue/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"title":        "Integration issue",
		"status":       "todo",
	}, &issue)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create issue: expected 201, got %d", resp.StatusCode)
	}
	issueID := issue["id"].(string)

	var listResp map[string]any
	resp = rpcRequest(t, "/rpc/issue/list", map[string]any{"workspace_id": testWorkspaceID}, &listResp)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list issue: expected 200, got %d", resp.StatusCode)
	}

	var comment map[string]any
	resp = rpcRequest(t, "/rpc/comment/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"issue_id":     issueID,
		"content":      "hello integration",
	}, &comment)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create comment: expected 201, got %d", resp.StatusCode)
	}

	var comments map[string]any
	resp = rpcRequest(t, "/rpc/comment/list", map[string]any{
		"workspace_id": testWorkspaceID,
		"issue_id":     issueID,
	}, &comments)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list comments: expected 200, got %d", resp.StatusCode)
	}
}

func TestLabelCRUD(t *testing.T) {
	var label map[string]any
	resp := rpcRequest(t, "/rpc/label/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"name":         "bug",
		"color":        "#ff0000",
	}, &label)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create label: expected 201, got %d", resp.StatusCode)
	}
	if label["name"] != "bug" {
		t.Fatalf("expected name=bug, got %v", label["name"])
	}

	var list map[string]any
	resp = rpcRequest(t, "/rpc/label/list", map[string]any{"workspace_id": testWorkspaceID}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list labels: expected 200, got %d", resp.StatusCode)
	}
}

func TestProjectCRUD(t *testing.T) {
	var project map[string]any
	resp := rpcRequest(t, "/rpc/project/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"name":         "Integration Project",
	}, &project)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create project: expected 201, got %d", resp.StatusCode)
	}

	var list map[string]any
	resp = rpcRequest(t, "/rpc/project/list", map[string]any{"workspace_id": testWorkspaceID}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list projects: expected 200, got %d", resp.StatusCode)
	}
}

func TestAgentCRUD(t *testing.T) {
	var agent map[string]any
	resp := rpcRequest(t, "/rpc/agent/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"name":         "test-agent",
	}, &agent)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create agent: expected 201, got %d", resp.StatusCode)
	}
	agentID := agent["id"].(string)

	var list map[string]any
	resp = rpcRequest(t, "/rpc/agent/list", map[string]any{"workspace_id": testWorkspaceID}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list agents: expected 200, got %d", resp.StatusCode)
	}

	var archived map[string]any
	resp = rpcRequest(t, "/rpc/agent/archive", map[string]any{
		"workspace_id": testWorkspaceID,
		"agent_id":     agentID,
	}, &archived)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("archive agent: expected 200, got %d", resp.StatusCode)
	}
}

func TestCycleCRUD(t *testing.T) {
	var cycle map[string]any
	resp := rpcRequest(t, "/rpc/cycle/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"name":         "Sprint 1",
	}, &cycle)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create cycle: expected 201, got %d", resp.StatusCode)
	}

	var list map[string]any
	resp = rpcRequest(t, "/rpc/cycle/list", map[string]any{"workspace_id": testWorkspaceID}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list cycles: expected 200, got %d", resp.StatusCode)
	}
}

func TestPATCRUD(t *testing.T) {
	var pat map[string]any
	resp := rpcRequest(t, "/rpc/pat/create", map[string]any{
		"name": "test-token",
	}, &pat)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("create pat: expected 201, got %d", resp.StatusCode)
	}
	if pat["token"] == nil || pat["token"] == "" {
		t.Fatal("expected non-empty token in PAT response")
	}

	var list map[string]any
	resp = rpcRequest(t, "/rpc/pat/list", map[string]any{}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list pats: expected 200, got %d", resp.StatusCode)
	}
}

func TestWorkspaceList(t *testing.T) {
	var list map[string]any
	resp := rpcRequest(t, "/rpc/workspace/list", map[string]any{"limit": 10}, &list)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("list workspaces: expected 200, got %d", resp.StatusCode)
	}
}

func TestIssueUpdateAndStatus(t *testing.T) {
	var issue map[string]any
	rpcRequest(t, "/rpc/issue/create", map[string]any{
		"workspace_id": testWorkspaceID,
		"title":        "Status test issue",
		"status":       "todo",
	}, &issue)
	issueID := issue["id"].(string)

	var updated map[string]any
	resp := rpcRequest(t, "/rpc/issue/update", map[string]any{
		"workspace_id": testWorkspaceID,
		"issue_id":     issueID,
		"title":        "Updated title",
	}, &updated)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("update issue: expected 200, got %d", resp.StatusCode)
	}

	var statusUpdated map[string]any
	resp = rpcRequest(t, "/rpc/issue/update-status", map[string]any{
		"workspace_id": testWorkspaceID,
		"issue_id":     issueID,
		"status":       "in_progress",
	}, &statusUpdated)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("update status: expected 200, got %d", resp.StatusCode)
	}
}
