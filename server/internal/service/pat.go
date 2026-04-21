package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PAT struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Name        string    `json:"name"`
	TokenHash   string    `json:"-"`
	TokenPrefix string    `json:"token_prefix"`
	Scopes      []string  `json:"scopes"`
	ExpiresAt   time.Time `json:"expires_at"`
	LastUsedAt  *time.Time `json:"last_used_at"`
	CreatedAt   time.Time `json:"created_at"`
}

type PATService struct {
	db *pgxpool.Pool
}

func NewPATService(db *pgxpool.Pool) *PATService {
	return &PATService{db: db}
}

func (s *PATService) List(ctx context.Context, userID string) ([]PAT, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, user_id, name, token_prefix, scopes, expires_at, last_used_at, created_at
		 FROM pats WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pats []PAT
	for rows.Next() {
		var p PAT
		if err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.TokenPrefix, &p.Scopes,
			&p.ExpiresAt, &p.LastUsedAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		pats = append(pats, p)
	}
	return pats, nil
}

func (s *PATService) Create(ctx context.Context, userID, name string, scopes []string, expiresAt time.Time) (*PAT, string, error) {
	rawToken := make([]byte, 32)
	if _, err := rand.Read(rawToken); err != nil {
		return nil, "", err
	}
	token := "zoo_" + hex.EncodeToString(rawToken)
	tokenPrefix := token[:12] + "..."
	tokenHash := hex.EncodeToString(sha256.New().Sum([]byte(token)))

	id := uuid.New().String()
	now := time.Now()
	pat := &PAT{
		ID:          id,
		UserID:      userID,
		Name:        name,
		TokenHash:   tokenHash,
		TokenPrefix: tokenPrefix,
		Scopes:      scopes,
		ExpiresAt:   expiresAt,
		CreatedAt:   now,
	}

	_, err := s.db.Exec(ctx,
		`INSERT INTO pats (id, user_id, name, token_hash, token_prefix, scopes, expires_at, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		id, userID, name, tokenHash, tokenPrefix, scopes, expiresAt, now)
	if err != nil {
		return nil, "", err
	}
	return pat, token, nil
}

func (s *PATService) Delete(ctx context.Context, userID, patID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM pats WHERE id = $1 AND user_id = $2`, patID, userID)
	return err
}

func (s *PATService) Validate(ctx context.Context, token string) (*PAT, error) {
	tokenHash := hex.EncodeToString(sha256.New().Sum([]byte(token)))
	var p PAT
	err := s.db.QueryRow(ctx,
		`SELECT id, user_id, name, token_prefix, scopes, expires_at, last_used_at, created_at
		 FROM pats WHERE token_hash = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
		tokenHash).Scan(&p.ID, &p.UserID, &p.Name, &p.TokenPrefix, &p.Scopes, &p.ExpiresAt, &p.LastUsedAt, &p.CreatedAt)
	if err != nil {
		return nil, err
	}

	s.db.Exec(ctx, `UPDATE pats SET last_used_at = NOW() WHERE id = $1`, p.ID)
	return &p, nil
}
