package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IssueSubscriber struct {
	ID        string    `json:"id"`
	IssueID   string    `json:"issue_id"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

type IssueReaction struct {
	ID        string    `json:"id"`
	IssueID   string    `json:"issue_id"`
	Emoji     string    `json:"emoji"`
	ActorType string    `json:"actor_type"`
	ActorID   string    `json:"actor_id"`
	CreatedAt time.Time `json:"created_at"`
}

func ListIssueSubscribers(db *pgxpool.Pool, workspaceID, issueID string) ([]IssueSubscriber, error) {
	rows, err := db.Query(context.Background(),
		`SELECT s.id, s.issue_id, s.user_id, s.created_at
		 FROM issue_subscribers s
		 JOIN issues i ON i.id = s.issue_id AND i.workspace_id = $1
		 WHERE s.issue_id = $2
		 ORDER BY s.created_at ASC`,
		workspaceID, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []IssueSubscriber
	for rows.Next() {
		var s IssueSubscriber
		if err := rows.Scan(&s.ID, &s.IssueID, &s.UserID, &s.CreatedAt); err != nil {
			return nil, err
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func SubscribeIssue(db *pgxpool.Pool, workspaceID, issueID, userID string) (*IssueSubscriber, error) {
	existing, err := db.Exec(context.Background(),
		`SELECT 1 FROM issue_subscribers s
		 JOIN issues i ON i.id = s.issue_id AND i.workspace_id = $1
		 WHERE s.issue_id = $2 AND s.user_id = $3`,
		workspaceID, issueID, userID)
	if err != nil {
		return nil, err
	}
	if existing.RowsAffected() > 0 {
		return nil, nil
	}

	id := uuid.New().String()
	now := time.Now()
	sub := &IssueSubscriber{ID: id, IssueID: issueID, UserID: userID, CreatedAt: now}
	_, err = db.Exec(context.Background(),
		`INSERT INTO issue_subscribers (id, issue_id, user_id, created_at) VALUES ($1,$2,$3,$4)`,
		id, issueID, userID, now)
	if err != nil {
		return nil, err
	}
	return sub, nil
}

func UnsubscribeIssue(db *pgxpool.Pool, workspaceID, issueID, userID string) error {
	_, err := db.Exec(context.Background(),
		`DELETE FROM issue_subscribers USING issues
		 WHERE issue_subscribers.issue_id = issues.id
		 AND issues.workspace_id = $1
		 AND issue_subscribers.issue_id = $2
		 AND issue_subscribers.user_id = $3`,
		workspaceID, issueID, userID)
	return err
}

func ListIssueReactions(db *pgxpool.Pool, workspaceID, issueID string) ([]IssueReaction, error) {
	rows, err := db.Query(context.Background(),
		`SELECT r.id, r.issue_id, r.emoji, r.actor_type, r.actor_id, r.created_at
		 FROM issue_reactions r
		 JOIN issues i ON i.id = r.issue_id AND i.workspace_id = $1
		 WHERE r.issue_id = $2
		 ORDER BY r.created_at ASC`,
		workspaceID, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reactions []IssueReaction
	for rows.Next() {
		var r IssueReaction
		if err := rows.Scan(&r.ID, &r.IssueID, &r.Emoji, &r.ActorType, &r.ActorID, &r.CreatedAt); err != nil {
			return nil, err
		}
		reactions = append(reactions, r)
	}
	return reactions, nil
}

func AddIssueReaction(db *pgxpool.Pool, workspaceID, issueID, emoji, actorType, actorID string) (*IssueReaction, error) {
	exists, err := db.Exec(context.Background(),
		`SELECT 1 FROM issue_reactions r
		 JOIN issues i ON i.id = r.issue_id AND i.workspace_id = $1
		 WHERE r.issue_id = $2 AND r.emoji = $3 AND r.actor_type = $4 AND r.actor_id = $5`,
		workspaceID, issueID, emoji, actorType, actorID)
	if err != nil {
		return nil, err
	}
	if exists.RowsAffected() > 0 {
		return nil, nil
	}

	id := uuid.New().String()
	now := time.Now()
	r := &IssueReaction{ID: id, IssueID: issueID, Emoji: emoji, ActorType: actorType, ActorID: actorID, CreatedAt: now}
	_, err = db.Exec(context.Background(),
		`INSERT INTO issue_reactions (id, issue_id, emoji, actor_type, actor_id, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		id, issueID, emoji, actorType, actorID, now)
	if err != nil {
		return nil, err
	}
	return r, nil
}

func RemoveIssueReaction(db *pgxpool.Pool, workspaceID, issueID, emoji, actorType, actorID string) error {
	_, err := db.Exec(context.Background(),
		`DELETE FROM issue_reactions USING issues
		 WHERE issue_reactions.issue_id = issues.id
		 AND issues.workspace_id = $1
		 AND issue_reactions.issue_id = $2
		 AND issue_reactions.emoji = $3
		 AND issue_reactions.actor_type = $4
		 AND issue_reactions.actor_id = $5`,
		workspaceID, issueID, emoji, actorType, actorID)
	return err
}
