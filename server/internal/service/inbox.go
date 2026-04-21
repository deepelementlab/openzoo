package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InboxService struct {
	db *pgxpool.Pool
}

func NewInboxService(db *pgxpool.Pool) *InboxService {
	return &InboxService{db: db}
}

type InboxItem struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	UserID      string    `json:"user_id"`
	ActorType   *string   `json:"actor_type"`
	ActorID     *string   `json:"actor_id"`
	Type        string    `json:"type"`
	Severity    string    `json:"severity"`
	EntityType  *string   `json:"entity_type"`
	EntityID    *string   `json:"entity_id"`
	Title       string    `json:"title"`
	Message     *string   `json:"message"`
	IsRead      bool      `json:"is_read"`
	IsArchived  bool      `json:"is_archived"`
	CreatedAt   time.Time `json:"created_at"`
	Details     *string   `json:"details_json"`
}

func (s *InboxService) List(ctx context.Context, workspaceID, userID string, unreadOnly bool, limit, offset int) ([]InboxItem, int, int, error) {
	query := `SELECT id, workspace_id, user_id, actor_type, actor_id, type, severity, entity_type, entity_id, title, message, is_read, is_archived, created_at, details FROM inbox_items WHERE workspace_id = $1 AND user_id = $2 AND is_archived = false`
	args := []interface{}{workspaceID, userID}
	argN := 3
	if unreadOnly {
		query += fmt.Sprintf(` AND is_read = false`)
	}
	countQuery := `SELECT COUNT(*) FROM (` + query + `) sub`
	var total int
	if err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, 0, err
	}
	var unreadCount int
	unreadQuery := `SELECT COUNT(*) FROM (` + query + ` AND is_read = false) sub`
	_ = s.db.QueryRow(ctx, unreadQuery, args...).Scan(&unreadCount)
	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argN, argN+1)
	args = append(args, limit, offset)
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, 0, err
	}
	defer rows.Close()
	var items []InboxItem
	for rows.Next() {
		var it InboxItem
		if err := rows.Scan(&it.ID, &it.WorkspaceID, &it.UserID, &it.ActorType, &it.ActorID, &it.Type, &it.Severity, &it.EntityType, &it.EntityID, &it.Title, &it.Message, &it.IsRead, &it.IsArchived, &it.CreatedAt, &it.Details); err != nil {
			return nil, 0, 0, err
		}
		items = append(items, it)
	}
	return items, total, unreadCount, nil
}

func (s *InboxService) MarkRead(ctx context.Context, workspaceID string, itemIDs []string) error {
	for _, id := range itemIDs {
		_, err := s.db.Exec(ctx, `UPDATE inbox_items SET is_read = true, read_at = NOW() WHERE id = $1 AND workspace_id = $2`, id, workspaceID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *InboxService) MarkArchived(ctx context.Context, workspaceID string, itemIDs []string) error {
	for _, id := range itemIDs {
		_, err := s.db.Exec(ctx, `UPDATE inbox_items SET is_archived = true WHERE id = $1 AND workspace_id = $2`, id, workspaceID)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *InboxService) MarkAllRead(ctx context.Context, workspaceID, userID string) error {
	_, err := s.db.Exec(ctx, `UPDATE inbox_items SET is_read = true, read_at = NOW() WHERE workspace_id = $1 AND user_id = $2 AND is_read = false`, workspaceID, userID)
	return err
}

func (s *InboxService) Create(ctx context.Context, workspaceID, recipientType, userID, actorType, actorID, itemType, severity, entityID, title, message string) (*InboxItem, error) {
	id := uuid.New().String()
	now := time.Now()
	_, err := s.db.Exec(ctx, `INSERT INTO inbox_items (id, workspace_id, user_id, actor_type, actor_id, type, severity, entity_type, entity_id, title, message, is_read, is_archived, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,false,$12)`,
		id, workspaceID, userID, actorType, actorID, itemType, severity, recipientType, entityID, title, message, now)
	if err != nil {
		return nil, err
	}
	return &InboxItem{ID: id, WorkspaceID: workspaceID, UserID: userID, Type: itemType, Severity: severity, Title: title, CreatedAt: now}, nil
}

func CreateInboxItem(ctx context.Context, db *pgxpool.Pool, workspaceID, userID, actorType, entityID, itemType, title, body string) error {
	id := uuid.New().String()
	_, err := db.Exec(ctx,
		`INSERT INTO inbox_items (id, workspace_id, user_id, actor_type, actor_id, type, severity, entity_type, entity_id, title, message, is_read, is_archived, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, 'info', 'issue', $7, $8, $9, false, false, NOW())`,
		id, workspaceID, userID, actorType, entityID, itemType, entityID, title, body)
	return err
}

func CreateInboxForSubscribers(ctx context.Context, db *pgxpool.Pool, workspaceID, issueID, excludeUserID, itemType, title, body string) error {
	rows, err := db.Query(ctx,
		`SELECT user_id FROM issue_subscribers WHERE issue_id = $1 AND user_id != $2`,
		issueID, excludeUserID)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			continue
		}
		_ = CreateInboxItem(ctx, db, workspaceID, userID, "member", issueID, itemType, title, body)
	}
	return nil
}
