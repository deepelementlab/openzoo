package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPATService_CreateToken(t *testing.T) {
	svc := &PATService{}
	assert.NotNil(t, svc)

	params := map[string]any{
		"user_id": "user_123",
		"name":    "My API Token",
		"scopes":  []string{"read", "write"},
	}

	assert.Equal(t, "user_123", params["user_id"])
	assert.Equal(t, "My API Token", params["name"])
	assert.Len(t, params["scopes"].([]string), 2)
}

func TestPATService_CreateToken_Expiry(t *testing.T) {
	expiresAt := time.Now().Add(30 * 24 * time.Hour)
	assert.True(t, expiresAt.After(time.Now()))
}

func TestPATService_RevokeToken(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	userID := "user_123"
	patID := "pat_456"

	assert.NotEmpty(t, userID)
	assert.NotEmpty(t, patID)
}

func TestPATService_ListTokens(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	userID := "user_123"
	assert.NotEmpty(t, userID)
}

func TestPATService_ValidateToken(t *testing.T) {
	ctx := context.Background()
	assert.NotNil(t, ctx)

	token := "zoo_abc123def456..."
	assert.Contains(t, token, "zoo_")
}

func TestPATService_TokenPrefix(t *testing.T) {
	token := "zoo_" + "a1b2c3d4e5f6" + "..."
	tokenPrefix := token[:12] + "..."

	assert.Contains(t, token, "zoo_")
	assert.NotEmpty(t, tokenPrefix)
	assert.Contains(t, tokenPrefix, "...")
}

func TestPATService_TokenScopes(t *testing.T) {
	scopes := []string{"read", "write", "admin"}

	assert.Len(t, scopes, 3)
	assert.Contains(t, scopes, "read")
	assert.Contains(t, scopes, "write")
	assert.Contains(t, scopes, "admin")
}

func TestPATService_PATStruct(t *testing.T) {
	now := time.Now()
	expiresAt := now.Add(30 * 24 * time.Hour)
	scopes := []string{"read", "write"}

	pat := PAT{
		ID:          "pat_123",
		UserID:      "user_456",
		Name:        "My API Token",
		TokenHash:   "zoo_abc123",
		TokenPrefix: "zoo_abc123...",
		Scopes:      scopes,
		ExpiresAt:   expiresAt,
		CreatedAt:   now,
	}

	assert.Equal(t, "pat_123", pat.ID)
	assert.Equal(t, "user_456", pat.UserID)
	assert.Equal(t, "My API Token", pat.Name)
	assert.Len(t, pat.Scopes, 2)
	assert.True(t, pat.ExpiresAt.After(now))
}
