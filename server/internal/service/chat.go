package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ChatService struct {
	db *pgxpool.Pool
}

func NewChatService(db *pgxpool.Pool) *ChatService {
	return &ChatService{db: db}
}

type ChatSession struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	AgentID     string    `json:"agent_id"`
	CreatorID   string    `json:"creator_id"`
	Title       string    `json:"title"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ChatMessage struct {
	ID            string    `json:"id"`
	ChatSessionID string    `json:"chat_session_id"`
	Role          string    `json:"role"`
	Content       string    `json:"content"`
	TaskID        *string   `json:"task_id"`
	CreatedAt     time.Time `json:"created_at"`
}

func (s *ChatService) ListSessions(ctx context.Context, workspaceID, agentID string, limit, offset int) ([]ChatSession, error) {
	query := `SELECT id, workspace_id, agent_id, creator_id, COALESCE(title,''), status, created_at, updated_at FROM chat_sessions WHERE workspace_id = $1 AND status = 'active'`
	args := []interface{}{workspaceID}
	if agentID != "" {
		query += fmt.Sprintf(` AND agent_id = $%d`, len(args)+1)
		args = append(args, agentID)
	}
	query += ` ORDER BY updated_at DESC`
	if limit <= 0 {
		limit = 50
	}
	query += fmt.Sprintf(` LIMIT %d OFFSET %d`, limit, offset)
	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var sessions []ChatSession
	for rows.Next() {
		var cs ChatSession
		if err := rows.Scan(&cs.ID, &cs.WorkspaceID, &cs.AgentID, &cs.CreatorID, &cs.Title, &cs.Status, &cs.CreatedAt, &cs.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, cs)
	}
	return sessions, nil
}

func (s *ChatService) CreateSession(ctx context.Context, workspaceID, agentID, creatorID, title string) (*ChatSession, error) {
	id := uuid.New().String()
	now := time.Now()
	if title == "" {
		title = "New Chat"
	}
	_, err := s.db.Exec(ctx, `INSERT INTO chat_sessions (id, workspace_id, agent_id, creator_id, title, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'active',$6,$6)`,
		id, workspaceID, agentID, creatorID, title, now)
	if err != nil {
		return nil, err
	}
	return &ChatSession{ID: id, WorkspaceID: workspaceID, AgentID: agentID, CreatorID: creatorID, Title: title, Status: "active", CreatedAt: now, UpdatedAt: now}, nil
}

func (s *ChatService) ListMessages(ctx context.Context, workspaceID, sessionID string, limit, offset int) ([]ChatMessage, error) {
	if limit <= 0 {
		limit = 100
	}
	rows, err := s.db.Query(ctx, `SELECT id, chat_session_id, role, content, task_id, created_at FROM chat_messages WHERE chat_session_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`, sessionID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []ChatMessage
	for rows.Next() {
		var m ChatMessage
		if err := rows.Scan(&m.ID, &m.ChatSessionID, &m.Role, &m.Content, &m.TaskID, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}

func (s *ChatService) SendMessage(ctx context.Context, sessionID, role, content string) (*ChatMessage, error) {
	id := uuid.New().String()
	now := time.Now()
	_, err := s.db.Exec(ctx, `INSERT INTO chat_messages (id, chat_session_id, role, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
		id, sessionID, role, content, now)
	if err != nil {
		return nil, err
	}
	return &ChatMessage{ID: id, ChatSessionID: sessionID, Role: role, Content: content, CreatedAt: now}, nil
}

func (s *ChatService) GetSession(ctx context.Context, sessionID string) (*ChatSession, error) {
	var cs ChatSession
	err := s.db.QueryRow(ctx, `SELECT id, workspace_id, agent_id, creator_id, COALESCE(title,''), status, created_at, updated_at FROM chat_sessions WHERE id = $1`, sessionID).
		Scan(&cs.ID, &cs.WorkspaceID, &cs.AgentID, &cs.CreatorID, &cs.Title, &cs.Status, &cs.CreatedAt, &cs.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &cs, nil
}

func (s *ChatService) LinkTaskToMessage(ctx context.Context, messageID, taskID string) error {
	_, err := s.db.Exec(ctx, `UPDATE chat_messages SET task_id = $1 WHERE id = $2`, taskID, messageID)
	return err
}
