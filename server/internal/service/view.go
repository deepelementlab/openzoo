package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ViewService struct {
	db *pgxpool.Pool
}

func NewViewService(db *pgxpool.Pool) *ViewService {
	return &ViewService{db: db}
}

func (s *ViewService) ListViews(ctx context.Context, workspaceID, creatorID string) ([]map[string]any, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at
		FROM views
		WHERE workspace_id = $1 AND (is_shared = true OR creator_id = $2)
		ORDER BY updated_at DESC
	`, workspaceID, creatorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var views []map[string]any
	for rows.Next() {
		var id, wsID, name, desc, creatorID string
		var filtersJSON, sortOrderJSON []byte
		var isShared bool
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&id, &wsID, &name, &desc, &filtersJSON, &sortOrderJSON, &isShared, &creatorID, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		var filters map[string]any
		var sortOrder []any
		json.Unmarshal(filtersJSON, &filters)
		json.Unmarshal(sortOrderJSON, &sortOrder)

		views = append(views, map[string]any{
			"id":           id,
			"workspace_id": wsID,
			"name":         name,
			"description":  desc,
			"filters":      filters,
			"sort_order":   sortOrder,
			"is_shared":    isShared,
			"creator_id":   creatorID,
			"created_at":   createdAt.Format(time.RFC3339),
			"updated_at":   updatedAt.Format(time.RFC3339),
		})
	}
	return views, nil
}

func (s *ViewService) CreateView(ctx context.Context, workspaceID, creatorID, name, description string, filters map[string]any, sortOrder []any, isShared bool) (map[string]any, error) {
	id := uuid.New().String()
	now := time.Now()

	filtersJSON, _ := json.Marshal(filters)
	sortOrderJSON, _ := json.Marshal(sortOrder)

	err := s.db.QueryRow(ctx, `
		INSERT INTO views (id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at
	`, id, workspaceID, name, description, filtersJSON, sortOrderJSON, isShared, creatorID, now, now).Scan(
		&id, &workspaceID, &name, &description, &filtersJSON, &sortOrderJSON, &isShared, &creatorID, &now, &now)
	if err != nil {
		return nil, err
	}

	return map[string]any{
		"id":           id,
		"workspace_id": workspaceID,
		"name":         name,
		"description":  description,
		"filters":      filters,
		"sort_order":   sortOrder,
		"is_shared":    isShared,
		"creator_id":   creatorID,
		"created_at":   now.Format(time.RFC3339),
		"updated_at":   now.Format(time.RFC3339),
	}, nil
}

func (s *ViewService) UpdateView(ctx context.Context, viewID string, updates map[string]any) (map[string]any, error) {
	var id, wsID, name, desc, creatorID string
	var filtersJSON, sortOrderJSON []byte
	var isShared bool
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at
		FROM views WHERE id = $1
	`, viewID).Scan(&id, &wsID, &name, &desc, &filtersJSON, &sortOrderJSON, &isShared, &creatorID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	var filters map[string]any
	var sortOrder []any
	json.Unmarshal(filtersJSON, &filters)
	json.Unmarshal(sortOrderJSON, &sortOrder)

	if v, ok := updates["name"]; ok {
		name = v.(string)
	}
	if v, ok := updates["description"]; ok {
		desc = v.(string)
	}
	if v, ok := updates["filters"]; ok {
		filters = v.(map[string]any)
		filtersJSON, _ = json.Marshal(filters)
	}
	if v, ok := updates["sort_order"]; ok {
		sortOrder = v.([]any)
		sortOrderJSON, _ = json.Marshal(sortOrder)
	}
	if v, ok := updates["is_shared"]; ok {
		isShared = v.(bool)
	}

	now := time.Now()
	err = s.db.QueryRow(ctx, `
		UPDATE views SET name = $1, description = $2, filters = $3, sort_order = $4, is_shared = $5, updated_at = $6
		WHERE id = $7
		RETURNING id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at
	`, name, desc, filtersJSON, sortOrderJSON, isShared, now, id).Scan(
		&id, &wsID, &name, &desc, &filtersJSON, &sortOrderJSON, &isShared, &creatorID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	json.Unmarshal(filtersJSON, &filters)
	json.Unmarshal(sortOrderJSON, &sortOrder)

	return map[string]any{
		"id":           id,
		"workspace_id": wsID,
		"name":         name,
		"description":  desc,
		"filters":      filters,
		"sort_order":   sortOrder,
		"is_shared":    isShared,
		"creator_id":   creatorID,
		"created_at":   createdAt.Format(time.RFC3339),
		"updated_at":   updatedAt.Format(time.RFC3339),
	}, nil
}

func (s *ViewService) DeleteView(ctx context.Context, viewID string) error {
	_, err := s.db.Exec(ctx, "DELETE FROM views WHERE id = $1", viewID)
	return err
}

func (s *ViewService) GetView(ctx context.Context, viewID string) (map[string]any, error) {
	var id, wsID, name, desc, creatorID string
	var filtersJSON, sortOrderJSON []byte
	var isShared bool
	var createdAt, updatedAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT id, workspace_id, name, description, filters, sort_order, is_shared, creator_id, created_at, updated_at
		FROM views WHERE id = $1
	`, viewID).Scan(&id, &wsID, &name, &desc, &filtersJSON, &sortOrderJSON, &isShared, &creatorID, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	var filters map[string]any
	var sortOrder []any
	json.Unmarshal(filtersJSON, &filters)
	json.Unmarshal(sortOrderJSON, &sortOrder)

	return map[string]any{
		"id":           id,
		"workspace_id": wsID,
		"name":         name,
		"description":  desc,
		"filters":      filters,
		"sort_order":   sortOrder,
		"is_shared":    isShared,
		"creator_id":   creatorID,
		"created_at":   createdAt.Format(time.RFC3339),
		"updated_at":   updatedAt.Format(time.RFC3339),
	}, nil
}
