package connectapi

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)

func contextWithValues(ctx context.Context, userID, role string) context.Context {
	ctx = context.WithValue(ctx, middleware.UserIDKey, userID)
	ctx = context.WithValue(ctx, middleware.RoleKey, role)
	return ctx
}

func TestCanManageAgent_OwnerCanManage(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest("POST", "/", nil)
	ctx := contextWithValues(req.Context(), "user-1", "owner")
	req = req.WithContext(ctx)
	if !h.canManageAgent(req, "ws-1", "user-1") {
		t.Error("owner should be able to manage own agent")
	}
}

func TestCanManageAgent_AdminCanManage(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest("POST", "/", nil)
	ctx := contextWithValues(req.Context(), "admin-1", "admin")
	req = req.WithContext(ctx)
	if !h.canManageAgent(req, "ws-1", "other-user") {
		t.Error("admin should be able to manage any agent")
	}
}

func TestCanManageAgent_MemberCanManageOwn(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest("POST", "/", nil)
	ctx := contextWithValues(req.Context(), "member-1", "member")
	req = req.WithContext(ctx)
	if !h.canManageAgent(req, "ws-1", "member-1") {
		t.Error("member should be able to manage own agent")
	}
}

func TestCanManageAgent_MemberCannotManageOthers(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest("POST", "/", nil)
	ctx := contextWithValues(req.Context(), "member-1", "member")
	req = req.WithContext(ctx)
	if h.canManageAgent(req, "ws-1", "other-user") {
		t.Error("member should NOT be able to manage other's agent")
	}
}

func TestCanManageAgent_NoUserID(t *testing.T) {
	h := &Handler{}
	req := httptest.NewRequest("POST", "/", nil)
	if h.canManageAgent(req, "ws-1", "user-1") {
		t.Error("unauthenticated user should not be able to manage agent")
	}
}

func TestReadJSON_EmptyBody(t *testing.T) {
	req := httptest.NewRequest("POST", "/", strings.NewReader(""))
	req.ContentLength = 0
	m := readJSON(req)
	if m == nil {
		t.Fatal("readJSON should never return nil")
	}
	if len(m) != 0 {
		t.Errorf("expected empty map, got %d keys", len(m))
	}
}

func TestReadJSON_ValidJSON(t *testing.T) {
	body := `{"workspace_id":"ws-1","name":"test"}`
	req := httptest.NewRequest("POST", "/", strings.NewReader(body))
	req.ContentLength = int64(len(body))
	m := readJSON(req)
	if m["workspace_id"] != "ws-1" {
		t.Errorf("expected workspace_id=ws-1, got %v", m["workspace_id"])
	}
	if m["name"] != "test" {
		t.Errorf("expected name=test, got %v", m["name"])
	}
}

func TestReadJSON_InvalidJSON(t *testing.T) {
	body := `{invalid json`
	req := httptest.NewRequest("POST", "/", strings.NewReader(body))
	req.ContentLength = int64(len(body))
	m := readJSON(req)
	if m == nil {
		t.Fatal("readJSON should never return nil even for invalid JSON")
	}
}

func TestGetStr_NilMap(t *testing.T) {
	result := getStr(nil, "key")
	if result != "" {
		t.Errorf("expected empty string for nil map, got %q", result)
	}
}

func TestGetStr_MissingKey(t *testing.T) {
	m := map[string]interface{}{"other": "value"}
	result := getStr(m, "key")
	if result != "" {
		t.Errorf("expected empty string for missing key, got %q", result)
	}
}
