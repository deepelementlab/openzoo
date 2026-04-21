package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ExternalSessionService struct {
	db *pgxpool.Pool
}

func NewExternalSessionService(db *pgxpool.Pool) *ExternalSessionService {
	return &ExternalSessionService{db: db}
}

type ExternalSession struct {
	ID             string          `json:"id"`
	WorkspaceID    string          `json:"workspace_id"`
	AgentID        *string         `json:"agent_id"`
	SessionID      string          `json:"session_id"`
	PID            int             `json:"pid"`
	ProcessCwd     string          `json:"process_cwd"`
	ClaudeVersion  string          `json:"claude_version"`
	SessionFilePath string         `json:"session_file_path"`
	Status         string          `json:"status"`
	DiscoveredAt   time.Time       `json:"discovered_at"`
	LastSeenAt     time.Time       `json:"last_seen_at"`
	Metadata       json.RawMessage `json:"metadata"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type RegisterExternalSessionInput struct {
	WorkspaceID     string
	SessionID       string
	PID             int
	ProcessCwd      string
	ClaudeVersion   string
	SessionFilePath string
	Metadata        json.RawMessage
}

func (s *ExternalSessionService) RegisterSession(ctx context.Context, in RegisterExternalSessionInput) (*ExternalSession, error) {
	id := uuid.New().String()
	now := time.Now()
	var metadataVal interface{}
	if len(in.Metadata) > 0 {
		metadataVal = in.Metadata
	} else {
		metadataVal = "{}"
	}
	_, err := s.db.Exec(ctx,
		`INSERT INTO external_sessions (id, workspace_id, session_id, pid, process_cwd, claude_version, session_file_path, status, metadata, discovered_at, last_seen_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,'discovered',$8,$9,$9,$9,$9)`,
		id, in.WorkspaceID, in.SessionID, in.PID, in.ProcessCwd, in.ClaudeVersion, in.SessionFilePath, metadataVal, now)
	if err != nil {
		return nil, err
	}
	return &ExternalSession{
		ID: id, WorkspaceID: in.WorkspaceID, SessionID: in.SessionID,
		PID: in.PID, ProcessCwd: in.ProcessCwd, ClaudeVersion: in.ClaudeVersion,
		SessionFilePath: in.SessionFilePath, Status: "discovered",
		Metadata: in.Metadata, DiscoveredAt: now, LastSeenAt: now,
		CreatedAt: now, UpdatedAt: now,
	}, nil
}

func (s *ExternalSessionService) UpsertByPID(ctx context.Context, in RegisterExternalSessionInput) (*ExternalSession, error) {
	now := time.Now()
	var metadataVal interface{}
	if len(in.Metadata) > 0 {
		metadataVal = in.Metadata
	} else {
		metadataVal = "{}"
	}
	var es ExternalSession
	err := s.db.QueryRow(ctx,
		`INSERT INTO external_sessions (id, workspace_id, session_id, pid, process_cwd, claude_version, session_file_path, status, metadata, discovered_at, last_seen_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,'discovered',$8,$9,$9,$9,$9)
		 ON CONFLICT (workspace_id, session_id) DO UPDATE SET
		   pid = CASE WHEN EXCLUDED.pid > 0 THEN EXCLUDED.pid ELSE external_sessions.pid END,
		   process_cwd = CASE WHEN EXCLUDED.process_cwd != '' THEN EXCLUDED.process_cwd ELSE external_sessions.process_cwd END,
		   claude_version = EXCLUDED.claude_version,
		   session_file_path = CASE WHEN EXCLUDED.session_file_path != '' THEN EXCLUDED.session_file_path ELSE external_sessions.session_file_path END,
		   metadata = EXCLUDED.metadata,
		   last_seen_at = EXCLUDED.last_seen_at,
		   updated_at = EXCLUDED.updated_at,
		   status = CASE WHEN external_sessions.status = 'lost' THEN 'discovered' ELSE external_sessions.status END
		 RETURNING id, workspace_id, agent_id, session_id, pid, process_cwd, claude_version, session_file_path, status, discovered_at, last_seen_at, metadata, created_at, updated_at`,
		uuid.New().String(), in.WorkspaceID, in.SessionID, in.PID, in.ProcessCwd, in.ClaudeVersion, in.SessionFilePath, metadataVal, now).
		Scan(&es.ID, &es.WorkspaceID, &es.AgentID, &es.SessionID, &es.PID, &es.ProcessCwd, &es.ClaudeVersion, &es.SessionFilePath, &es.Status, &es.DiscoveredAt, &es.LastSeenAt, &es.Metadata, &es.CreatedAt, &es.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &es, nil
}

func (s *ExternalSessionService) ListDiscovered(ctx context.Context, workspaceID string) ([]ExternalSession, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, workspace_id, COALESCE(agent_id::text,''), session_id, pid, COALESCE(process_cwd,''), COALESCE(claude_version,''), COALESCE(session_file_path,''), status, discovered_at, last_seen_at, COALESCE(metadata::jsonb,'{}'), created_at, updated_at
		 FROM external_sessions WHERE workspace_id = $1 ORDER BY last_seen_at DESC`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	sessions := make([]ExternalSession, 0)
	for rows.Next() {
		var es ExternalSession
		var agentIDStr string
		if err := rows.Scan(&es.ID, &es.WorkspaceID, &agentIDStr, &es.SessionID, &es.PID, &es.ProcessCwd, &es.ClaudeVersion, &es.SessionFilePath, &es.Status, &es.DiscoveredAt, &es.LastSeenAt, &es.Metadata, &es.CreatedAt, &es.UpdatedAt); err != nil {
			return nil, err
		}
		if agentIDStr != "" {
			es.AgentID = &agentIDStr
		}
		sessions = append(sessions, es)
	}
	return sessions, nil
}

func (s *ExternalSessionService) Get(ctx context.Context, id string) (*ExternalSession, error) {
	var es ExternalSession
	var agentIDStr string
	err := s.db.QueryRow(ctx,
		`SELECT id, workspace_id, COALESCE(agent_id::text,''), session_id, pid, COALESCE(process_cwd,''), COALESCE(claude_version,''), COALESCE(session_file_path,''), status, discovered_at, last_seen_at, COALESCE(metadata::jsonb,'{}'), created_at, updated_at
		 FROM external_sessions WHERE id = $1`, id).
		Scan(&es.ID, &es.WorkspaceID, &agentIDStr, &es.SessionID, &es.PID, &es.ProcessCwd, &es.ClaudeVersion, &es.SessionFilePath, &es.Status, &es.DiscoveredAt, &es.LastSeenAt, &es.Metadata, &es.CreatedAt, &es.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if agentIDStr != "" {
		es.AgentID = &agentIDStr
	}
	return &es, nil
}

func (s *ExternalSessionService) UpdateStatus(ctx context.Context, id, status string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE external_sessions SET status = $2, last_seen_at = NOW(), updated_at = NOW() WHERE id = $1`,
		id, status)
	return err
}

func (s *ExternalSessionService) MonitorSession(ctx context.Context, id string) error {
	return s.UpdateStatus(ctx, id, "monitoring")
}

func (s *ExternalSessionService) AdoptSession(ctx context.Context, id, agentID string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE external_sessions SET status = 'adopted', agent_id = $2, updated_at = NOW() WHERE id = $1`,
		id, agentID)
	return err
}

func (s *ExternalSessionService) ReleaseSession(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE external_sessions SET status = 'discovered', agent_id = NULL, updated_at = NOW() WHERE id = $1`,
		id)
	return err
}

func (s *ExternalSessionService) TouchLastSeen(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE external_sessions SET last_seen_at = NOW(), updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (s *ExternalSessionService) CleanupLostSessions(ctx context.Context, maxAge time.Duration) (int64, error) {
	tag, err := s.db.Exec(ctx,
		`UPDATE external_sessions SET status = 'lost', updated_at = NOW()
		 WHERE status IN ('discovered','monitoring','adopted')
		   AND last_seen_at < NOW() - $1::interval`, maxAge.String())
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *ExternalSessionService) FindByPID(ctx context.Context, pid int) (*ExternalSession, error) {
	var es ExternalSession
	var agentIDStr string
	err := s.db.QueryRow(ctx,
		`SELECT id, workspace_id, COALESCE(agent_id::text,''), session_id, pid, COALESCE(process_cwd,''), COALESCE(claude_version,''), COALESCE(session_file_path,''), status, discovered_at, last_seen_at, COALESCE(metadata::jsonb,'{}'), created_at, updated_at
		 FROM external_sessions WHERE pid = $1`, pid).
		Scan(&es.ID, &es.WorkspaceID, &agentIDStr, &es.SessionID, &es.PID, &es.ProcessCwd, &es.ClaudeVersion, &es.SessionFilePath, &es.Status, &es.DiscoveredAt, &es.LastSeenAt, &es.Metadata, &es.CreatedAt, &es.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if agentIDStr != "" {
		es.AgentID = &agentIDStr
	}
	return &es, nil
}

func (s *ExternalSessionService) FindActiveBySessionID(ctx context.Context, sessionID string) (*ExternalSession, error) {
	var es ExternalSession
	var agentIDStr string
	err := s.db.QueryRow(ctx,
		`SELECT id, workspace_id, COALESCE(agent_id::text,''), session_id, pid, COALESCE(process_cwd,''), COALESCE(claude_version,''), COALESCE(session_file_path,''), status, discovered_at, last_seen_at, COALESCE(metadata::jsonb,'{}'), created_at, updated_at
		 FROM external_sessions WHERE session_id = $1 AND status IN ('discovered','monitoring','adopted')`, sessionID).
		Scan(&es.ID, &es.WorkspaceID, &agentIDStr, &es.SessionID, &es.PID, &es.ProcessCwd, &es.ClaudeVersion, &es.SessionFilePath, &es.Status, &es.DiscoveredAt, &es.LastSeenAt, &es.Metadata, &es.CreatedAt, &es.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if agentIDStr != "" {
		es.AgentID = &agentIDStr
	}
	return &es, nil
}
