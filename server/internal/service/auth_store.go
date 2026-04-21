package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/middleware"
)

type AuthStore struct {
	db *pgxpool.Pool
}

func NewAuthStore(db *pgxpool.Pool) *AuthStore {
	return &AuthStore{db: db}
}

func (s *AuthStore) GetDaemonTokenByHash(ctx context.Context, hash string) (*middleware.DaemonTokenRecord, error) {
	var rec middleware.DaemonTokenRecord
	err := s.db.QueryRow(ctx,
		`SELECT id, daemon_id, workspace_id FROM daemon_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
		hash).Scan(&rec.ID, &rec.DaemonID, &rec.WorkspaceID)
	if err != nil {
		return nil, err
	}
	return &rec, nil
}

func (s *AuthStore) GetPATByHash(ctx context.Context, hash string) (*middleware.PATRecord, error) {
	var rec middleware.PATRecord
	err := s.db.QueryRow(ctx,
		`SELECT id, user_id FROM pats WHERE token_hash = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
		hash).Scan(&rec.ID, &rec.UserID)
	if err != nil {
		return nil, err
	}
	return &rec, nil
}
