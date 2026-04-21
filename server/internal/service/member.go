package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/openzoo-ai/openzoo/server/internal/database"
	"github.com/openzoo-ai/openzoo/server/internal/events"
)

type MemberWithUser struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	UserID      string    `json:"user_id"`
	Role        string    `json:"role"`
	CreatedAt   time.Time `json:"created_at"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	AvatarURL   *string   `json:"avatar_url"`
}

func ListMembers(ctx context.Context, workspaceID string) ([]MemberWithUser, error) {
	pool := database.Pool()
	rows, err := pool.Query(ctx, `
		SELECT m.id, m.workspace_id, m.user_id, m.role, m.created_at,
			COALESCE(u.name,''), u.email, u.avatar_url
		FROM members m JOIN users u ON u.id = m.user_id
		WHERE m.workspace_id = $1 ORDER BY m.created_at ASC
	`, workspaceID)
	if err != nil { return nil, err }
	defer rows.Close()
	var members []MemberWithUser
	for rows.Next() {
		var m MemberWithUser
		if err := rows.Scan(&m.ID, &m.WorkspaceID, &m.UserID, &m.Role, &m.CreatedAt,
			&m.Name, &m.Email, &m.AvatarURL); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func CreateMember(ctx context.Context, workspaceID, email, role string) (*MemberWithUser, error) {
	pool := database.Pool()
	// Find or create user
	var userID string
	err := pool.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&userID)
	if err != nil {
		userID = uuid.New().String()
		now := time.Now()
		_, err := pool.Exec(ctx, `INSERT INTO users (id, name, email, created_at, updated_at) VALUES ($1, '', $2, $3, $3)`,
			userID, email, now)
		if err != nil { return nil, err }
	}

	id := uuid.New().String()
	now := time.Now()
	if role == "" { role = "member" }
	_, err = pool.Exec(ctx, `INSERT INTO members (id, workspace_id, user_id, role, created_at) VALUES ($1, $2, $3, $4, $5)`,
		id, workspaceID, userID, role, now)
	if err != nil { return nil, err }

	events.GetPublisher().PublishWorkspaceEvent(workspaceID, "member:added", map[string]string{
		"member_id": id, "user_id": userID, "email": email,
	})

	return &MemberWithUser{
		ID: id, WorkspaceID: workspaceID, UserID: userID,
		Role: role, CreatedAt: now, Email: email,
	}, nil
}

func UpdateMember(ctx context.Context, workspaceID, memberID, role string) (*MemberWithUser, error) {
	pool := database.Pool()
	_, err := pool.Exec(ctx, `UPDATE members SET role = $1 WHERE id = $2 AND workspace_id = $3`, role, memberID, workspaceID)
	if err != nil { return nil, err }
	members, err := ListMembers(ctx, workspaceID)
	if err != nil { return nil, err }
	for _, m := range members {
		if m.ID == memberID { return &m, nil }
	}
	return nil, nil
}

func DeleteMember(ctx context.Context, workspaceID, memberID string) error {
	pool := database.Pool()
	_, err := pool.Exec(ctx, `DELETE FROM members WHERE id = $1 AND workspace_id = $2`, memberID, workspaceID)
	return err
}
