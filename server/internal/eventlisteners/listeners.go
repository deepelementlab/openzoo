package eventlisteners

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/openzoo-ai/openzoo/server/internal/events"
)

func Init(db *pgxpool.Pool, publisher *events.Publisher) {
	bus := events.GetBus()

	bus.SubscribeAll(func(evt events.Event) {
		go func() {
			if err := publisher.Publish(context.Background(), evt.WorkspaceID, evt.Type, map[string]interface{}{
				"actor_id":   evt.ActorID,
				"actor_type": evt.ActorType,
				"payload":    evt.Payload,
			}); err != nil {
				log.Printf("failed to publish event %s: %v", evt.Type, err)
			}
		}()
	})

	bus.Subscribe(events.EventIssueCreated, func(evt events.Event) {
		go func() {
			wsID, _ := evt.Payload.(map[string]interface{})["workspace_id"].(string)
			issueID, _ := evt.Payload.(map[string]interface{})["id"].(string)
			if wsID != "" && issueID != "" {
				recordIssueChange(db, wsID, issueID, evt.ActorID, "create")
			}
		}()
	})

	bus.Subscribe(events.EventIssueUpdated, func(evt events.Event) {
		go func() {
			payload, ok := evt.Payload.(map[string]interface{})
			if !ok {
				return
			}
			wsID, _ := payload["workspace_id"].(string)
			issueID, _ := payload["id"].(string)
			if wsID != "" && issueID != "" {
				recordIssueChange(db, wsID, issueID, evt.ActorID, "update")
			}
		}()
	})

	bus.Subscribe(events.EventCommentCreated, func(evt events.Event) {
		go func() {
			payload, ok := evt.Payload.(map[string]interface{})
			if !ok {
				return
			}
			wsID := evt.WorkspaceID
			issueID, _ := payload["issue_id"].(string)
			authorID, _ := payload["author_id"].(string)
			if wsID != "" && issueID != "" && authorID != "" {
				createInboxForSubscribers(context.Background(), db, wsID, issueID, authorID, "comment_reply", "New comment", "A new comment was posted")
			}
		}()
	})

	bus.Subscribe(events.EventMemberAdded, func(evt events.Event) {
		go func() {
			payload, ok := evt.Payload.(map[string]interface{})
			if !ok {
				return
			}
			userID, _ := payload["user_id"].(string)
			wsID := evt.WorkspaceID
			if wsID != "" && userID != "" {
				createInboxItem(context.Background(), db, wsID, userID, "system", wsID, "workspace:member_added", "Added to workspace", "You were added to a workspace")
			}
		}()
	})

	log.Println("event listeners initialized")
}

func recordIssueChange(db *pgxpool.Pool, workspaceID, issueID, userID, action string) {
	_, _ = db.Exec(context.Background(),
		`INSERT INTO activities (id, workspace_id, issue_id, user_id, action, entity_type, entity_id, old_value, new_value, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		uuid.New().String(), workspaceID, issueID, userID, action, "issue", issueID, "", "", time.Now())
}

func createInboxItem(ctx context.Context, db *pgxpool.Pool, workspaceID, userID, actorType, entityID, itemType, title, body string) error {
	id := uuid.New().String()
	_, err := db.Exec(ctx,
		`INSERT INTO inbox_items (id, workspace_id, recipient_type, recipient_id, actor_type, actor_id, type, severity, issue_id, title, body, read, archived, created_at)
		 VALUES ($1, $2, 'user', $3, $4, $5, $6, 'info', $7, $8, $9, false, false, NOW())`,
		id, workspaceID, userID, actorType, entityID, itemType, entityID, title, body)
	return err
}

func createInboxForSubscribers(ctx context.Context, db *pgxpool.Pool, workspaceID, issueID, excludeUserID, itemType, title, body string) error {
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
		_ = createInboxItem(ctx, db, workspaceID, userID, "member", issueID, itemType, title, body)
	}
	return nil
}
