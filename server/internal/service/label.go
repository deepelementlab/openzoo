package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LabelService struct {
	db *pgxpool.Pool
}

func NewLabelService(db *pgxpool.Pool) *LabelService {
	return &LabelService{db: db}
}

func (s *LabelService) ListLabels(ctx context.Context, workspaceID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, workspace_id, name, description, color, created_at, updated_at
		FROM labels WHERE workspace_id = $1 ORDER BY name
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []map[string]any
	for rows.Next() {
		var id, wsID, name, desc, color string
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &wsID, &name, &desc, &color, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		labels = append(labels, map[string]any{
			"id":          id,
			"workspace_id": wsID,
			"name":        name,
			"description": desc,
			"color":       color,
			"created_at":  createdAt.Format(time.RFC3339),
			"updated_at":  updatedAt.Format(time.RFC3339),
		})
	}
	return labels, nil
}

func (s *LabelService) CreateLabel(ctx context.Context, workspaceID, name, description, color string) (map[string]any, error) {
	id := uuid.New().String()
	now := time.Now()

	err := s.db.QueryRow(ctx, `
		INSERT INTO labels (id, workspace_id, name, description, color, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, workspace_id, name, description, color, created_at, updated_at
	`, id, workspaceID, name, description, color, now, now).Scan(&id, &workspaceID, &name, &description, &color, &now, &now)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":          id,
		"workspace_id": workspaceID,
		"name":        name,
		"description": description,
		"color":       color,
		"created_at":  now.Format(time.RFC3339),
		"updated_at":  now.Format(time.RFC3339),
	}, nil
}

func (s *LabelService) UpdateLabel(ctx context.Context, labelID string, updates map[string]any) (map[string]any, error) {
	var id, wsID, name, desc, color string
	var createdAt, updatedAt time.Time
	err := s.db.QueryRow(ctx, `
		SELECT id, workspace_id, name, description, color, created_at, updated_at
		FROM labels WHERE id = $1
	`, labelID).Scan(&id, &wsID, &name, &desc, &color, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	if v, ok := updates["name"]; ok {
		name = v.(string)
	}
	if v, ok := updates["description"]; ok {
		desc = v.(string)
	}
	if v, ok := updates["color"]; ok {
		color = v.(string)
	}

	now := time.Now()
	err = s.db.QueryRow(ctx, `
		UPDATE labels SET name = $1, description = $2, color = $3, updated_at = $4
		WHERE id = $5
		RETURNING id, workspace_id, name, description, color, created_at, updated_at
	`, name, desc, color, now, id).Scan(&id, &wsID, &name, &desc, &color, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":          id,
		"workspace_id": wsID,
		"name":        name,
		"description": desc,
		"color":       color,
		"created_at":  createdAt.Format(time.RFC3339),
		"updated_at":  updatedAt.Format(time.RFC3339),
	}, nil
}

func (s *LabelService) DeleteLabel(ctx context.Context, labelID string) error {
	_, err := s.db.Exec(ctx, "DELETE FROM labels WHERE id = $1", labelID)
	return err
}

func (s *LabelService) AddLabelToIssue(ctx context.Context, issueID, labelID string) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO issue_labels (issue_id, label_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, issueID, labelID)
	return err
}

func (s *LabelService) RemoveLabelFromIssue(ctx context.Context, issueID, labelID string) error {
	_, err := s.db.Exec(ctx, `
		DELETE FROM issue_labels WHERE issue_id = $1 AND label_id = $2
	`, issueID, labelID)
	return err
}

func (s *LabelService) GetIssueLabels(ctx context.Context, issueID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `
		SELECT l.id, l.name, l.description, l.color
		FROM labels l
		JOIN issue_labels il ON l.id = il.label_id
		WHERE il.issue_id = $1
	`, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []map[string]any
	for rows.Next() {
		var id, name, desc, color string
		if err := rows.Scan(&id, &name, &desc, &color); err != nil {
			return nil, err
		}
		labels = append(labels, map[string]any{
			"id":          id,
			"name":        name,
			"description": desc,
			"color":       color,
		})
	}
	return labels, nil
}
