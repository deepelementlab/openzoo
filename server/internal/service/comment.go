package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/openzoo-ai/openzoo/server/internal/database"
	"github.com/openzoo-ai/openzoo/server/internal/events"
)

type Comment struct {
	ID          string       `json:"id"`
	IssueID     string       `json:"issue_id"`
	AuthorType  string       `json:"author_type"`
	AuthorID    string       `json:"author_id"`
	Content     string       `json:"content"`
	Type        string       `json:"type"`
	ParentID    string       `json:"parent_id"`
	Reactions   []Reaction   `json:"reactions"`
	Attachments []Attachment `json:"attachments"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type Reaction struct {
	ID         string    `json:"id"`
	CommentID  string    `json:"comment_id"`
	ActorType  string    `json:"actor_type"`
	ActorID    string    `json:"actor_id"`
	Emoji      string    `json:"emoji"`
	CreatedAt  time.Time `json:"created_at"`
}

type Attachment struct {
	ID            string    `json:"id"`
	WorkspaceID   string    `json:"workspace_id"`
	IssueID       string    `json:"issue_id"`
	CommentID     string    `json:"comment_id"`
	UploaderType  string    `json:"uploader_type"`
	UploaderID    string    `json:"uploader_id"`
	Filename      string    `json:"filename"`
	URL           string    `json:"url"`
	DownloadURL   string    `json:"download_url"`
	ContentType   string    `json:"content_type"`
	SizeBytes     int64     `json:"size_bytes"`
	CreatedAt     time.Time `json:"created_at"`
}

func ListComments(ctx context.Context, workspaceID, issueID string, limit, offset int) ([]Comment, error) {
	pool := database.Pool()
	if limit <= 0 { limit = 50 }
	rows, err := pool.Query(ctx,
		`SELECT c.id, c.issue_id, c.author_type, c.author_id, c.content, c.type,
		 COALESCE(c.parent_id,''), c.created_at, c.updated_at
		 FROM comments c
		 JOIN issues i ON i.id = c.issue_id AND i.workspace_id = $1
		 WHERE c.issue_id = $2
		 ORDER BY c.created_at ASC LIMIT $3 OFFSET $4`,
		workspaceID, issueID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var comments []Comment
	for rows.Next() {
		var c Comment
		if err := rows.Scan(&c.ID, &c.IssueID, &c.AuthorType, &c.AuthorID, &c.Content, &c.Type,
			&c.ParentID, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, nil
}

func CreateComment(ctx context.Context, workspaceID, issueID, userID, content, parentID string) (*Comment, error) {
	pool := database.Pool()
	id := uuid.New().String()
	now := time.Now()
	c := &Comment{
		ID:         id,
		IssueID:    issueID,
		AuthorType: "member",
		AuthorID:   userID,
		Content:    content,
		Type:       "comment",
		ParentID:   parentID,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	var pid interface{}
	if parentID != "" {
		pid = parentID
	}
	_, err := pool.Exec(ctx,
		`INSERT INTO comments (id, issue_id, workspace_id, author_type, author_id, content, type, parent_id, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		c.ID, c.IssueID, workspaceID, c.AuthorType, c.AuthorID, c.Content, c.Type, pid, c.CreatedAt, c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	go events.GetPublisher().PublishWorkspace(ctx, workspaceID, "comment:created", c)
	return c, nil
}

func UpdateComment(ctx context.Context, workspaceID, commentID, content string) (*Comment, error) {
	pool := database.Pool()
	c := &Comment{}
	err := pool.QueryRow(ctx,
		`UPDATE comments SET content = $1, updated_at = NOW()
		 WHERE id = $2
		 RETURNING id, issue_id, author_type, author_id, content, type, COALESCE(parent_id,''), created_at, updated_at`,
		content, commentID).
		Scan(&c.ID, &c.IssueID, &c.AuthorType, &c.AuthorID, &c.Content, &c.Type, &c.ParentID, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	go events.GetPublisher().PublishWorkspace(ctx, workspaceID, "comment:updated", c)
	return c, nil
}

func DeleteComment(ctx context.Context, workspaceID, commentID string) error {
	var issueID string
	err := database.Pool().QueryRow(ctx, `SELECT issue_id FROM comments WHERE id = $1`, commentID).Scan(&issueID)
	if err != nil {
		return err
	}
	_, err = database.Pool().Exec(ctx, `DELETE FROM comments WHERE id = $1`, commentID)
	if err != nil {
		return err
	}
	go events.GetPublisher().PublishWorkspace(ctx, workspaceID, "comment:deleted",
		map[string]string{"comment_id": commentID, "issue_id": issueID})
	return nil
}

func AddReaction(ctx context.Context, workspaceID, commentID, actorType, actorID, emoji string) (*Reaction, error) {
	pool := database.Pool()
	id := uuid.New().String()
	now := time.Now()
	r := &Reaction{ID: id, CommentID: commentID, ActorType: actorType, ActorID: actorID, Emoji: emoji, CreatedAt: now}
	_, err := pool.Exec(ctx,
		`INSERT INTO reactions (id, comment_id, actor_type, actor_id, emoji, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		id, commentID, actorType, actorID, emoji, now)
	if err != nil {
		return nil, err
	}
	go events.GetPublisher().PublishWorkspace(ctx, workspaceID, "reaction:added", r)
	return r, nil
}

func RemoveReaction(ctx context.Context, workspaceID, commentID, actorType, actorID, emoji string) error {
	_, err := database.Pool().Exec(ctx,
		`DELETE FROM reactions WHERE comment_id = $1 AND actor_type = $2 AND actor_id = $3 AND emoji = $4`,
		commentID, actorType, actorID, emoji)
	return err
}
