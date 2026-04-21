package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectService struct {
	db *pgxpool.Pool
}

func NewProjectService(db *pgxpool.Pool) *ProjectService {
	return &ProjectService{db: db}
}

type Project struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	LeadType    *string   `json:"lead_type"`
	LeadID      *string   `json:"lead_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	IssueCount  int       `json:"issue_count"`
	DoneCount   int       `json:"done_count"`
}

func (s *ProjectService) List(ctx context.Context, workspaceID string, limit, offset int) ([]Project, int, error) {
	query := `SELECT p.id, p.workspace_id, p.title, COALESCE(p.description,''), COALESCE(p.icon,''), p.status, p.priority, p.lead_type, p.lead_id, p.created_at, p.updated_at, COALESCE((SELECT COUNT(*) FROM issues WHERE project_id = p.id),0) as issue_count, COALESCE((SELECT COUNT(*) FROM issues WHERE project_id = p.id AND status = 'done'),0) as done_count FROM projects p WHERE p.workspace_id = $1 ORDER BY p.created_at DESC`
	args := []interface{}{workspaceID}
	var total int
	countQ := `SELECT COUNT(*) FROM projects WHERE workspace_id = $1`
	if err := s.db.QueryRow(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(` LIMIT %d OFFSET %d`, limit, offset)
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.WorkspaceID, &p.Title, &p.Description, &p.Icon, &p.Status, &p.Priority, &p.LeadType, &p.LeadID, &p.CreatedAt, &p.UpdatedAt, &p.IssueCount, &p.DoneCount); err != nil {
			return nil, 0, err
		}
		projects = append(projects, p)
	}
	return projects, total, nil
}

func (s *ProjectService) Create(ctx context.Context, workspaceID, title, description, icon, status, priority string) (*Project, error) {
	id := uuid.New().String()
	now := time.Now()
	if status == "" {
		status = "planned"
	}
	if priority == "" {
		priority = "none"
	}
	_, err := s.db.Exec(ctx, `INSERT INTO projects (id, workspace_id, title, description, icon, status, priority, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)`,
		id, workspaceID, title, description, icon, status, priority, now)
	if err != nil {
		return nil, err
	}
	return &Project{ID: id, WorkspaceID: workspaceID, Title: title, Description: description, Icon: icon, Status: status, Priority: priority, CreatedAt: now, UpdatedAt: now}, nil
}

func (s *ProjectService) Update(ctx context.Context, workspaceID, projectID string, fields map[string]interface{}) (*Project, error) {
	now := time.Now()
	fields["updated_at"] = now
	setClauses, args, _ := buildSetClauses(fields, allowedProjectFields, 3)
	if setClauses == "" {
		return s.Get(ctx, workspaceID, projectID)
	}
	args = append([]interface{}{projectID, workspaceID}, args...)
	_, err := s.db.Exec(ctx, fmt.Sprintf(`UPDATE projects SET %s WHERE id = $1 AND workspace_id = $2`, setClauses), args...)
	if err != nil {
		return nil, err
	}
	var p Project
	err = s.db.QueryRow(ctx, `SELECT p.id, p.workspace_id, p.title, COALESCE(p.description,''), COALESCE(p.icon,''), p.status, p.priority, p.lead_type, p.lead_id, p.created_at, p.updated_at, 0, 0 FROM projects p WHERE id = $1 AND workspace_id = $2`, projectID, workspaceID).
		Scan(&p.ID, &p.WorkspaceID, &p.Title, &p.Description, &p.Icon, &p.Status, &p.Priority, &p.LeadType, &p.LeadID, &p.CreatedAt, &p.UpdatedAt, &p.IssueCount, &p.DoneCount)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *ProjectService) Delete(ctx context.Context, workspaceID, projectID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM projects WHERE id = $1 AND workspace_id = $2`, projectID, workspaceID)
	return err
}

func (s *ProjectService) Get(ctx context.Context, workspaceID, projectID string) (*Project, error) {
	var p Project
	err := s.db.QueryRow(ctx, `SELECT p.id, p.workspace_id, p.title, COALESCE(p.description,''), COALESCE(p.icon,''), p.status, p.priority, p.lead_type, p.lead_id, p.created_at, p.updated_at, COALESCE((SELECT COUNT(*) FROM issues WHERE project_id = p.id),0), COALESCE((SELECT COUNT(*) FROM issues WHERE project_id = p.id AND status = 'done'),0) FROM projects p WHERE p.id = $1 AND p.workspace_id = $2`, projectID, workspaceID).
		Scan(&p.ID, &p.WorkspaceID, &p.Title, &p.Description, &p.Icon, &p.Status, &p.Priority, &p.LeadType, &p.LeadID, &p.CreatedAt, &p.UpdatedAt, &p.IssueCount, &p.DoneCount)
	if err != nil {
		return nil, err
	}
	return &p, nil
}
