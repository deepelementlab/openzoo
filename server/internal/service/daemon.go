package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DaemonService struct {
	db *pgxpool.Pool
}

func NewDaemonService(db *pgxpool.Pool) *DaemonService {
	return &DaemonService{db: db}
}

type Daemon struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	RuntimeID   string     `json:"runtime_id"`
	WorkspaceID string     `json:"workspace_id"`
	Status      string     `json:"status"`
	PID         int        `json:"pid"`
	Port        int        `json:"port"`
	LastSeen    *time.Time `json:"last_seen"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (s *DaemonService) Register(ctx context.Context, name, runtimeID, workspaceID string, pid, port int) (*Daemon, error) {
	id := uuid.New().String()
	now := time.Now()
	d := &Daemon{
		ID: id, Name: name, RuntimeID: runtimeID, WorkspaceID: workspaceID,
		Status: "idle", PID: pid, Port: port, LastSeen: &now, CreatedAt: now,
	}
	_, err := s.db.Exec(ctx,
		`INSERT INTO runtimes (id, workspace_id, daemon_id, name, runtime_mode, provider, status, device_info, last_seen_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, 'local', 'daemon', 'online', $5, $6, $6, $6)`,
		d.ID, workspaceID, runtimeID, name, fmt.Sprintf("pid=%d port=%d", pid, port), now)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func (s *DaemonService) Unregister(ctx context.Context, daemonID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM runtimes WHERE id = $1`, daemonID)
	return err
}

func (s *DaemonService) Get(ctx context.Context, daemonID string) (*Daemon, error) {
	var d Daemon
	var lastSeen *time.Time
	var deviceInfo string
	err := s.db.QueryRow(ctx,
		`SELECT id, name, COALESCE(daemon_id,''), workspace_id, status, device_info, last_seen_at, created_at
		 FROM runtimes WHERE id = $1 AND provider = 'daemon'`, daemonID).
		Scan(&d.ID, &d.Name, &d.RuntimeID, &d.WorkspaceID, &d.Status, &deviceInfo, &lastSeen, &d.CreatedAt)
	if err != nil {
		return nil, err
	}
	d.LastSeen = lastSeen
	return &d, nil
}

func (s *DaemonService) List(ctx context.Context, workspaceID string) ([]Daemon, error) {
	q := `SELECT id, name, COALESCE(daemon_id,''), workspace_id, status, device_info, last_seen_at, created_at
	      FROM runtimes WHERE provider = 'daemon'`
	args := []interface{}{}
	if workspaceID != "" {
		q += " AND workspace_id = $1"
		args = append(args, workspaceID)
	}
	q += " ORDER BY created_at DESC"
	rows, err := s.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var daemons []Daemon
	for rows.Next() {
		var d Daemon
		var lastSeen *time.Time
		var deviceInfo string
		if err := rows.Scan(&d.ID, &d.Name, &d.RuntimeID, &d.WorkspaceID, &d.Status, &deviceInfo, &lastSeen, &d.CreatedAt); err != nil {
			return nil, err
		}
		d.LastSeen = lastSeen
		daemons = append(daemons, d)
	}
	return daemons, nil
}

func (s *DaemonService) Heartbeat(ctx context.Context, daemonID string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE runtimes SET last_seen_at = NOW(), status = 'online', updated_at = NOW() WHERE id = $1`,
		daemonID)
	return err
}

func (s *DaemonService) GetStats(ctx context.Context) map[string]interface{} {
	rows, err := s.db.Query(ctx,
		`SELECT status, COUNT(*) FROM runtimes WHERE provider = 'daemon' GROUP BY status`)
	if err != nil {
		return map[string]interface{}{"total_daemons": 0}
	}
	defer rows.Close()

	stats := map[string]interface{}{}
	total := 0
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			continue
		}
		stats[status] = count
		total += count
	}
	stats["total_daemons"] = total
	return stats
}

func (s *DaemonService) SweepOffline(ctx context.Context, threshold time.Duration) error {
	_, err := s.db.Exec(ctx,
		`UPDATE runtimes SET status = 'offline', updated_at = NOW()
		 WHERE provider = 'daemon' AND status = 'online' AND last_seen_at < NOW() - $1::interval`,
		fmt.Sprintf("%d seconds", int(threshold.Seconds())))
	return err
}

func (s *DaemonService) SweepStaleTasks(ctx context.Context) (int, error) {
	tag, err := s.db.Exec(ctx, `
		UPDATE tasks SET status = 'failed', error = 'task timed out (daemon offline)', completed_at = NOW()
		WHERE (status = 'dispatched' AND dispatched_at < NOW() - INTERVAL '5 minutes')
		   OR (status = 'running' AND started_at < NOW() - INTERVAL '30 minutes')
	`)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}

func (s *DaemonService) ResetStuckIssues(ctx context.Context) (int, error) {
	tag, err := s.db.Exec(ctx, `
		UPDATE issues SET status = 'todo', updated_at = NOW()
		WHERE status = 'in_progress'
		  AND NOT EXISTS (
		    SELECT 1 FROM tasks t WHERE t.issue_id = issues.id AND t.status IN ('queued','dispatched','running')
		  )
	`)
	if err != nil {
		return 0, err
	}
	return int(tag.RowsAffected()), nil
}
