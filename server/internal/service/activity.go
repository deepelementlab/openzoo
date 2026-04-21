package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Activity struct {
	ID         string                 `json:"id"`
	WorkspaceID string                `json:"workspace_id"`
	IssueID    string                `json:"issue_id"`
	UserID     string                `json:"user_id"`
	Action     string                `json:"action"`
	EntityType string                `json:"entity_type"`
	EntityID   string                `json:"entity_id"`
	OldValue   string                `json:"old_value"`
	NewValue   string                `json:"new_value"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt  time.Time             `json:"created_at"`
}

func ListActivities(db *pgxpool.Pool, workspaceID, issueID string, limit int) ([]Activity, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := db.Query(context.Background(),
		`SELECT id, workspace_id, issue_id, user_id, action, entity_type, entity_id,
		 COALESCE(old_value,''), COALESCE(new_value,''), metadata, created_at
		 FROM activities
		 WHERE workspace_id = $1 AND issue_id = $2
		 ORDER BY created_at DESC LIMIT $3`,
		workspaceID, issueID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []Activity
	for rows.Next() {
		var a Activity
		if err := rows.Scan(&a.ID, &a.WorkspaceID, &a.IssueID, &a.UserID, &a.Action,
			&a.EntityType, &a.EntityID, &a.OldValue, &a.NewValue, &a.Metadata, &a.CreatedAt); err != nil {
			return nil, err
		}
		activities = append(activities, a)
	}
	return activities, nil
}

func CreateActivity(db *pgxpool.Pool, workspaceID, issueID, userID, action, entityType, entityID, oldValue, newValue string, metadata map[string]interface{}) (*Activity, error) {
	id := uuid.New().String()
	now := time.Now()
	a := &Activity{
		ID: id, WorkspaceID: workspaceID, IssueID: issueID, UserID: userID,
		Action: action, EntityType: entityType, EntityID: entityID,
		OldValue: oldValue, NewValue: newValue, Metadata: metadata, CreatedAt: now,
	}
	_, err := db.Exec(context.Background(),
		`INSERT INTO activities (id, workspace_id, issue_id, user_id, action, entity_type, entity_id, old_value, new_value, metadata, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		id, workspaceID, issueID, userID, action, entityType, entityID, oldValue, newValue, metadata, now)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func RecordIssueChange(db *pgxpool.Pool, workspaceID, issueID, userID, field, oldValue, newValue string) error {
	_, err := db.Exec(context.Background(),
		`INSERT INTO activities (id, workspace_id, issue_id, user_id, action, entity_type, entity_id, old_value, new_value, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		uuid.New().String(), workspaceID, issueID, userID, "update", "issue", issueID, oldValue, newValue, time.Now())
	return err
}
