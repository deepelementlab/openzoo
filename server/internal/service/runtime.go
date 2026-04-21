package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RuntimeService struct {
	db *pgxpool.Pool
}

func NewRuntimeService(db *pgxpool.Pool) *RuntimeService {
	return &RuntimeService{db: db}
}

type Runtime struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	DaemonID    *string   `json:"daemon_id"`
	Name        string    `json:"name"`
	RuntimeMode string    `json:"runtime_mode"`
	Provider    string    `json:"provider"`
	Status      string    `json:"status"`
	DeviceInfo  string    `json:"device_info"`
	OwnerID     *string   `json:"owner_id"`
	LastSeenAt  *time.Time `json:"last_seen_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (s *RuntimeService) List(ctx context.Context, workspaceID string) ([]Runtime, error) {
	rows, err := s.db.Query(ctx, `SELECT id, workspace_id, daemon_id, name, runtime_mode, provider, status, device_info, owner_id, last_seen_at, created_at, updated_at FROM runtimes WHERE workspace_id = $1 ORDER BY created_at DESC`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var runtimes []Runtime
	for rows.Next() {
		var r Runtime
		if err := rows.Scan(&r.ID, &r.WorkspaceID, &r.DaemonID, &r.Name, &r.RuntimeMode, &r.Provider, &r.Status, &r.DeviceInfo, &r.OwnerID, &r.LastSeenAt, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		runtimes = append(runtimes, r)
	}
	return runtimes, nil
}

func (s *RuntimeService) Register(ctx context.Context, workspaceID, name, provider, runtimeMode, deviceInfo string) (*Runtime, error) {
	id := uuid.New().String()
	now := time.Now()
	if runtimeMode == "" {
		runtimeMode = "local"
	}
	_, err := s.db.Exec(ctx, `INSERT INTO runtimes (id, workspace_id, name, runtime_mode, provider, status, device_info, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'online',$6,$7,$7)`,
		id, workspaceID, name, runtimeMode, provider, deviceInfo, now)
	if err != nil {
		return nil, err
	}
	return &Runtime{ID: id, WorkspaceID: workspaceID, Name: name, RuntimeMode: runtimeMode, Provider: provider, Status: "online", DeviceInfo: deviceInfo, CreatedAt: now, UpdatedAt: now}, nil
}

func (s *RuntimeService) UpdateHeartbeat(ctx context.Context, runtimeID string) error {
	_, err := s.db.Exec(ctx, `UPDATE runtimes SET last_seen_at = NOW(), status = 'online', updated_at = NOW() WHERE id = $1`, runtimeID)
	return err
}

func (s *RuntimeService) ListUsage(ctx context.Context, workspaceID, runtimeID string, days int) ([]map[string]interface{}, error) {
	if days <= 0 {
		days = 30
	}
	query := `SELECT runtime_id, DATE(created_at) as date, provider, model, SUM(input_tokens), SUM(output_tokens), SUM(cache_read_tokens), SUM(cache_write_tokens) FROM runtime_usage WHERE workspace_id = $1`
	args := []interface{}{workspaceID}
	if runtimeID != "" {
		query += fmt.Sprintf(` AND runtime_id = $%d`, len(args)+1)
		args = append(args, runtimeID)
	}
	query += fmt.Sprintf(` AND created_at >= NOW() - INTERVAL '%d days' GROUP BY runtime_id, DATE(created_at), provider, model ORDER BY date DESC`, days)
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []map[string]interface{}
	for rows.Next() {
		var runtimeID, provider, model string
		var date time.Time
		var inputTokens, outputTokens, cacheRead, cacheWrite int64
		if err := rows.Scan(&runtimeID, &date, &provider, &model, &inputTokens, &outputTokens, &cacheRead, &cacheWrite); err != nil {
			return nil, err
		}
		results = append(results, map[string]interface{}{
			"runtime_id": runtimeID, "date": date.Format("2006-01-02"), "provider": provider, "model": model,
			"input_tokens": inputTokens, "output_tokens": outputTokens, "cache_read_tokens": cacheRead, "cache_write_tokens": cacheWrite,
		})
	}
	return results, nil
}

func (s *RuntimeService) Get(ctx context.Context, workspaceID, runtimeID string) (*Runtime, error) {
	var r Runtime
	err := s.db.QueryRow(ctx,
		`SELECT id, workspace_id, daemon_id, name, runtime_mode, provider, status, device_info, owner_id, last_seen_at, created_at, updated_at
		 FROM runtimes WHERE id = $1 AND workspace_id = $2`,
		runtimeID, workspaceID).
		Scan(&r.ID, &r.WorkspaceID, &r.DaemonID, &r.Name, &r.RuntimeMode, &r.Provider, &r.Status, &r.DeviceInfo, &r.OwnerID, &r.LastSeenAt, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *RuntimeService) Update(ctx context.Context, workspaceID, runtimeID string, fields map[string]interface{}) (*Runtime, error) {
	now := time.Now()
	fields["updated_at"] = now
	setClauses, args, _ := buildSetClauses(fields, allowedRuntimeFields, 3)
	if setClauses == "" {
		return s.Get(ctx, workspaceID, runtimeID)
	}
	args = append([]interface{}{runtimeID, workspaceID}, args...)
	_, err := s.db.Exec(ctx, "UPDATE runtimes SET "+setClauses+" WHERE id = $1 AND workspace_id = $2", args...)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, workspaceID, runtimeID)
}

func (s *RuntimeService) Delete(ctx context.Context, workspaceID, runtimeID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM runtimes WHERE id = $1 AND workspace_id = $2`, runtimeID, workspaceID)
	return err
}
