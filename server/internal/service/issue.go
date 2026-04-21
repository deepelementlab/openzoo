package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IssueService struct {
	db *pgxpool.Pool
}

func NewIssueService(db *pgxpool.Pool) *IssueService {
	return &IssueService{db: db}
}

type Issue struct {
	ID            string    `json:"id"`
	WorkspaceID   string    `json:"workspace_id"`
	Number        int       `json:"number"`
	Identifier    string    `json:"identifier"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	Priority      string    `json:"priority"`
	AssigneeType  *string   `json:"assignee_type"`
	AssigneeID    *string   `json:"assignee_id"`
	CreatorType   string    `json:"creator_type"`
	CreatorID     string    `json:"creator_id"`
	ParentIssueID *string   `json:"parent_issue_id"`
	ProjectID     *string   `json:"project_id"`
	Position      float64   `json:"position"`
	DueDate       *string   `json:"due_date"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (s *IssueService) List(ctx context.Context, workspaceID string, limit, offset int, status, priority, assigneeID string, openOnly bool) ([]Issue, int, error) {
	query := `SELECT id, workspace_id, number, identifier, title, COALESCE(description,''), status, priority, assignee_type, assignee_id, creator_type, creator_id, parent_issue_id, project_id, COALESCE(position,0), due_date, created_at, updated_at FROM issues WHERE workspace_id = $1`
	args := []interface{}{workspaceID}
	argN := 2

	if status != "" {
		query += fmt.Sprintf(` AND status = $%d`, argN)
		args = append(args, status)
		argN++
	}
	if priority != "" {
		query += fmt.Sprintf(` AND priority = $%d`, argN)
		args = append(args, priority)
		argN++
	}
	if assigneeID != "" {
		query += fmt.Sprintf(` AND assignee_id = $%d`, argN)
		args = append(args, assigneeID)
		argN++
	}
	if openOnly {
		query += ` AND status NOT IN ('done', 'cancelled')`
	}

	countQuery := `SELECT COUNT(*) FROM (` + query + `) sub`
	var total int
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	args = append(args, limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var issues []Issue
	for rows.Next() {
		var iss Issue
		if err := rows.Scan(&iss.ID, &iss.WorkspaceID, &iss.Number, &iss.Identifier, &iss.Title, &iss.Description, &iss.Status, &iss.Priority, &iss.AssigneeType, &iss.AssigneeID, &iss.CreatorType, &iss.CreatorID, &iss.ParentIssueID, &iss.ProjectID, &iss.Position, &iss.DueDate, &iss.CreatedAt, &iss.UpdatedAt); err != nil {
			return nil, 0, err
		}
		issues = append(issues, iss)
	}
	return issues, total, nil
}

func (s *IssueService) Get(ctx context.Context, workspaceID, issueID string) (*Issue, error) {
	var iss Issue
	err := s.db.QueryRow(ctx, `SELECT id, workspace_id, number, identifier, title, COALESCE(description,''), status, priority, assignee_type, assignee_id, creator_type, creator_id, parent_issue_id, project_id, COALESCE(position,0), due_date, created_at, updated_at FROM issues WHERE id = $1 AND workspace_id = $2`, issueID, workspaceID).
		Scan(&iss.ID, &iss.WorkspaceID, &iss.Number, &iss.Identifier, &iss.Title, &iss.Description, &iss.Status, &iss.Priority, &iss.AssigneeType, &iss.AssigneeID, &iss.CreatorType, &iss.CreatorID, &iss.ParentIssueID, &iss.ProjectID, &iss.Position, &iss.DueDate, &iss.CreatedAt, &iss.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &iss, nil
}

func (s *IssueService) Create(ctx context.Context, workspaceID, title, description, status, priority string, extraFields map[string]interface{}) (*Issue, error) {
	id := uuid.New().String()
	now := time.Now()

	var number int
	err := s.db.QueryRow(ctx, `SELECT COALESCE(MAX(number),0) + 1 FROM issues WHERE workspace_id = $1`, workspaceID).Scan(&number)
	if err != nil {
		return nil, err
	}

	var prefix string
	err = s.db.QueryRow(ctx, `SELECT issue_prefix FROM workspaces WHERE id = $1`, workspaceID).Scan(&prefix)
	if err != nil {
		prefix = "OZ"
	}

	identifier := fmt.Sprintf("%s-%d", prefix, number)
	if status == "" {
		status = "todo"
	}
	if priority == "" {
		priority = "none"
	}

	var assigneeType, assigneeID, projectID, dueDate *string
	if v, ok := extraFields["assignee_type"].(string); ok && v != "" {
		assigneeType = &v
	}
	if v, ok := extraFields["assignee_id"].(string); ok && v != "" {
		assigneeID = &v
	}
	if v, ok := extraFields["project_id"].(string); ok && v != "" {
		projectID = &v
	}
	if v, ok := extraFields["due_date"].(string); ok && v != "" {
		dueDate = &v
	}

	_, err = s.db.Exec(ctx, `INSERT INTO issues (id, workspace_id, number, identifier, title, description, status, priority, assignee_type, assignee_id, project_id, due_date, creator_type, creator_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'member','system',$13,$13)`,
		id, workspaceID, number, identifier, title, description, status, priority, assigneeType, assigneeID, projectID, dueDate, now)
	if err != nil {
		return nil, err
	}

	issue := &Issue{
		ID: id, WorkspaceID: workspaceID, Number: number, Identifier: identifier,
		Title: title, Description: description, Status: status, Priority: priority,
		CreatorType: "member", CreatorID: "system", CreatedAt: now, UpdatedAt: now,
	}
	if assigneeType != nil {
		issue.AssigneeType = assigneeType
	}
	if assigneeID != nil {
		issue.AssigneeID = assigneeID
	}
	if projectID != nil {
		issue.ProjectID = projectID
	}
	if dueDate != nil {
		issue.DueDate = dueDate
	}
	return issue, nil
}

func (s *IssueService) Update(ctx context.Context, workspaceID, issueID string, fields map[string]interface{}) (*Issue, error) {
	if parentID, ok := fields["parent_issue_id"].(string); ok && parentID != "" {
		if err := s.CheckCycle(ctx, workspaceID, issueID, parentID); err != nil {
			return nil, err
		}
	}
	now := time.Now()
	fields["updated_at"] = now
	setClauses, args, _ := buildSetClauses(fields, allowedIssueFields, 3)
	if setClauses == "" {
		return s.Get(ctx, workspaceID, issueID)
	}
	args = append([]interface{}{issueID, workspaceID}, args...)
	query := fmt.Sprintf(`UPDATE issues SET %s WHERE id = $1 AND workspace_id = $2`, setClauses)
	_, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, workspaceID, issueID)
}

func (s *IssueService) Delete(ctx context.Context, workspaceID, issueID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM issues WHERE id = $1 AND workspace_id = $2`, issueID, workspaceID)
	return err
}

func (s *IssueService) BatchUpdate(ctx context.Context, workspaceID string, issueIDs []string, fields map[string]interface{}) ([]Issue, error) {
	now := time.Now()
	fields["updated_at"] = now
	setClauses, setArgs, _ := buildSetClauses(fields, allowedIssueFields, 2)
	if setClauses == "" {
		return nil, fmt.Errorf("no valid fields to update")
	}
	query := fmt.Sprintf(`UPDATE issues SET %s WHERE workspace_id = $1 AND id = ANY($%d)`, setClauses, len(setArgs)+2)
	args := append([]interface{}{workspaceID}, setArgs...)
	args = append(args, issueIDs)
	_, err := s.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	issues := make([]Issue, 0, len(issueIDs))
	for _, id := range issueIDs {
		iss, err := s.Get(ctx, workspaceID, id)
		if err != nil {
			continue
		}
		issues = append(issues, *iss)
	}
	return issues, nil
}

func (s *IssueService) CheckCycle(ctx context.Context, workspaceID, issueID, parentID string) error {
	if issueID == parentID {
		return fmt.Errorf("issue cannot be its own parent")
	}
	visited := map[string]bool{issueID: true}
	current := parentID
	for current != "" {
		if visited[current] {
			return fmt.Errorf("circular parent reference detected")
		}
		visited[current] = true
		var parent *string
		err := s.db.QueryRow(ctx, `SELECT parent_issue_id FROM issues WHERE id = $1 AND workspace_id = $2`, current, workspaceID).Scan(&parent)
		if err != nil {
			break
		}
		if parent == nil {
			break
		}
		current = *parent
	}
	return nil
}

func (s *IssueService) Search(ctx context.Context, workspaceID, query string, limit, offset int) ([]Issue, int, error) {
	if limit <= 0 {
		limit = 50
	}
	searchPattern := "%" + query + "%"
	exactPattern := query
	rankExpr := `
		(CASE WHEN title ILIKE $2 THEN 30 ELSE 0 END +
		 CASE WHEN identifier ILIKE $2 THEN 25 ELSE 0 END +
		 CASE WHEN description ILIKE $2 THEN 10 ELSE 0 END +
		 CASE WHEN title ILIKE $3 THEN 15 ELSE 0 END +
		 CASE WHEN status IN ('in_progress','in_review','todo') THEN 5 ELSE 0 END +
		 CASE WHEN priority IN ('urgent','high') THEN 5 ELSE 0 END +
		 LEAST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0, 10.0) * -0.5)`

	selectCols := `id, workspace_id, number, identifier, title, COALESCE(description,''), status, priority,
		assignee_type, assignee_id, creator_type, creator_id, parent_issue_id, project_id,
		COALESCE(position,0), due_date, created_at, updated_at`

	q := fmt.Sprintf(`SELECT %s, %s AS rank
		FROM issues
		WHERE workspace_id = $1 AND (title ILIKE $2 OR description ILIKE $2 OR identifier ILIKE $2)
		ORDER BY rank DESC, created_at DESC LIMIT $4 OFFSET $5`, selectCols, rankExpr)
	rows, err := s.db.Query(ctx, q, workspaceID, searchPattern, exactPattern, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var issues []Issue
	for rows.Next() {
		var iss Issue
		var rank float64
		if err := rows.Scan(&iss.ID, &iss.WorkspaceID, &iss.Number, &iss.Identifier, &iss.Title, &iss.Description,
			&iss.Status, &iss.Priority, &iss.AssigneeType, &iss.AssigneeID, &iss.CreatorType, &iss.CreatorID,
			&iss.ParentIssueID, &iss.ProjectID, &iss.Position, &iss.DueDate, &iss.CreatedAt, &iss.UpdatedAt, &rank); err != nil {
			return nil, 0, err
		}
		issues = append(issues, iss)
	}

	countQuery := `SELECT COUNT(*) FROM issues WHERE workspace_id = $1 AND (title ILIKE $2 OR description ILIKE $2 OR identifier ILIKE $2)`
	var total int
	if err := s.db.QueryRow(ctx, countQuery, workspaceID, searchPattern).Scan(&total); err != nil {
		return nil, 0, err
	}

	return issues, total, nil
}
