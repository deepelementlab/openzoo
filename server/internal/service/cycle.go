package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CycleService struct {
	db *pgxpool.Pool
}

func NewCycleService(db *pgxpool.Pool) *CycleService {
	return &CycleService{db: db}
}

func (s *CycleService) ListCycles(ctx context.Context, workspaceID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, workspace_id, name, description, number, start_date, end_date,
		       status, auto_create_next, created_at, updated_at
		FROM cycles WHERE workspace_id = $1
		ORDER BY number DESC
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cycles []map[string]any
	for rows.Next() {
		var id, wsID, name, desc, startDate, endDate, status string
		var number int
		var autoCreateNext bool
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &wsID, &name, &desc, &number, &startDate, &endDate, &status, &autoCreateNext, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		cycles = append(cycles, map[string]any{
			"id":               id,
			"workspace_id":     wsID,
			"name":             name,
			"description":      desc,
			"number":           number,
			"start_date":       startDate,
			"end_date":         endDate,
			"status":           status,
			"auto_create_next": autoCreateNext,
			"created_at":       createdAt.Format(time.RFC3339),
			"updated_at":       updatedAt.Format(time.RFC3339),
		})
	}
	return cycles, nil
}

func (s *CycleService) CreateCycle(ctx context.Context, workspaceID, name, description, startDate, endDate string, number int, autoCreateNext bool) (map[string]any, error) {
	id := uuid.New().String()
	now := time.Now()
	status := "upcoming"

	if startDate != "" && endDate != "" {
		startTime, _ := time.Parse("2006-01-02", startDate)
		endTime, _ := time.Parse("2006-01-02", endDate)
		if now.After(startTime) && now.Before(endTime) {
			status = "current"
		}
	}

	err := s.db.QueryRow(ctx, `
		INSERT INTO cycles (id, workspace_id, name, description, number, start_date, end_date,
		                   status, auto_create_next, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, workspace_id, name, description, number, start_date, end_date, status, auto_create_next, created_at, updated_at
	`, id, workspaceID, name, description, number, startDate, endDate, status, autoCreateNext, now, now).Scan(
		&id, &workspaceID, &name, &description, &number, &startDate, &endDate, &status, &autoCreateNext, &now, &now)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":               id,
		"workspace_id":     workspaceID,
		"name":             name,
		"description":      description,
		"number":           number,
		"start_date":       startDate,
		"end_date":         endDate,
		"status":           status,
		"auto_create_next": autoCreateNext,
		"created_at":       now.Format(time.RFC3339),
		"updated_at":       now.Format(time.RFC3339),
	}, nil
}

func (s *CycleService) UpdateCycle(ctx context.Context, cycleID string, updates map[string]any) (map[string]any, error) {
	var id, wsID, name, desc, startDate, endDate, status string
	var number int
	var autoCreateNext bool
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, workspace_id, name, description, number, start_date, end_date,
		       status, auto_create_next, created_at, updated_at
		FROM cycles WHERE id = $1
	`, cycleID).Scan(&id, &wsID, &name, &desc, &number, &startDate, &endDate, &status, &autoCreateNext, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	if v, ok := updates["name"]; ok {
		name = v.(string)
	}
	if v, ok := updates["description"]; ok {
		desc = v.(string)
	}
	if v, ok := updates["start_date"]; ok {
		startDate = v.(string)
	}
	if v, ok := updates["end_date"]; ok {
		endDate = v.(string)
	}
	if v, ok := updates["status"]; ok {
		status = v.(string)
	}
	if v, ok := updates["auto_create_next"]; ok {
		autoCreateNext = v.(bool)
	}

	now := time.Now()
	err = s.db.QueryRow(ctx, `
		UPDATE cycles SET name = $1, description = $2, start_date = $3, end_date = $4,
		                 status = $5, auto_create_next = $6, updated_at = $7
		WHERE id = $8
		RETURNING id, workspace_id, name, description, number, start_date, end_date, status, auto_create_next, created_at, updated_at
	`, name, desc, startDate, endDate, status, autoCreateNext, now, id).Scan(
		&id, &wsID, &name, &desc, &number, &startDate, &endDate, &status, &autoCreateNext, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":               id,
		"workspace_id":     wsID,
		"name":             name,
		"description":      desc,
		"number":           number,
		"start_date":       startDate,
		"end_date":         endDate,
		"status":           status,
		"auto_create_next": autoCreateNext,
		"created_at":       createdAt.Format(time.RFC3339),
		"updated_at":       updatedAt.Format(time.RFC3339),
	}, nil
}

func (s *CycleService) DeleteCycle(ctx context.Context, cycleID string) error {
	_, err := s.db.Exec(ctx, "DELETE FROM cycles WHERE id = $1", cycleID)
	return err
}

func (s *CycleService) GetCycle(ctx context.Context, cycleID string) (map[string]any, error) {
	var id, wsID, name, desc, startDate, endDate, status string
	var number int
	var autoCreateNext bool
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, workspace_id, name, description, number, start_date, end_date,
		       status, auto_create_next, created_at, updated_at
		FROM cycles WHERE id = $1
	`, cycleID).Scan(&id, &wsID, &name, &desc, &number, &startDate, &endDate, &status, &autoCreateNext, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":               id,
		"workspace_id":     wsID,
		"name":             name,
		"description":      desc,
		"number":           number,
		"start_date":       startDate,
		"end_date":         endDate,
		"status":           status,
		"auto_create_next": autoCreateNext,
		"created_at":       createdAt.Format(time.RFC3339),
		"updated_at":       updatedAt.Format(time.RFC3339),
	}, nil
}

func (s *CycleService) AddIssueToCycle(ctx context.Context, cycleID, issueID string) error {
	id := uuid.New().String()
	now := time.Now()

	_, err := s.db.Exec(ctx, `
		INSERT INTO cycle_issues (id, cycle_id, issue_id, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (cycle_id, issue_id) DO NOTHING
	`, id, cycleID, issueID, now)
	return err
}

func (s *CycleService) RemoveIssueFromCycle(ctx context.Context, cycleID, issueID string) error {
	_, err := s.db.Exec(ctx, `
		DELETE FROM cycle_issues WHERE cycle_id = $1 AND issue_id = $2
	`, cycleID, issueID)
	return err
}

func (s *CycleService) GetCycleIssues(ctx context.Context, cycleID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `
		SELECT i.id, i.title, i.status, i.priority, i.created_at
		FROM issues i
		JOIN cycle_issues ci ON i.id = ci.issue_id
		WHERE ci.cycle_id = $1
		ORDER BY i.created_at DESC
	`, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var issues []map[string]any
	for rows.Next() {
		var id, title, status, priority string
		var createdAt time.Time
		if err := rows.Scan(&id, &title, &status, &priority, &createdAt); err != nil {
			return nil, err
		}
		issues = append(issues, map[string]any{
			"id":         id,
			"title":      title,
			"status":     status,
			"priority":   priority,
			"created_at": createdAt.Format(time.RFC3339),
		})
	}
	return issues, nil
}

func (s *CycleService) GetNextCycleNumber(ctx context.Context, workspaceID string) (int, error) {
	var maxNumber int
	err := s.db.QueryRow(ctx, `
		SELECT COALESCE(MAX(number), 0) FROM cycles WHERE workspace_id = $1
	`, workspaceID).Scan(&maxNumber)
	if err != nil {
		return 0, err
	}
	return maxNumber + 1, nil
}
