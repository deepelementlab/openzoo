package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Pin struct {
	ID         string    `json:"id"`
	WorkspaceID string   `json:"workspace_id"`
	EntityType string    `json:"entity_type"`
	EntityID   string    `json:"entity_id"`
	Position   float64   `json:"position"`
	CreatedAt  time.Time `json:"created_at"`
}

func ListPins(db *pgxpool.Pool, workspaceID string) ([]Pin, error) {
	rows, err := db.Query(context.Background(),
		`SELECT id, workspace_id, entity_type, entity_id, position, created_at
		 FROM pins WHERE workspace_id = $1 ORDER BY position ASC`,
		workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pins []Pin
	for rows.Next() {
		var p Pin
		if err := rows.Scan(&p.ID, &p.WorkspaceID, &p.EntityType, &p.EntityID, &p.Position, &p.CreatedAt); err != nil {
			return nil, err
		}
		pins = append(pins, p)
	}
	return pins, nil
}

func CreatePin(db *pgxpool.Pool, workspaceID, entityType, entityID string) (*Pin, error) {
	existing, _ := db.Exec(context.Background(),
		`SELECT 1 FROM pins WHERE workspace_id = $1 AND entity_type = $2 AND entity_id = $3`,
		workspaceID, entityType, entityID)
	if existing.RowsAffected() > 0 {
		return nil, nil
	}

	var maxPos float64
	_ = db.QueryRow(context.Background(),
		`SELECT COALESCE(MAX(position), 0) FROM pins WHERE workspace_id = $1`,
		workspaceID).Scan(&maxPos)

	id := uuid.New().String()
	now := time.Now()
	pin := &Pin{ID: id, WorkspaceID: workspaceID, EntityType: entityType, EntityID: entityID, Position: maxPos + 1, CreatedAt: now}
	_, err := db.Exec(context.Background(),
		`INSERT INTO pins (id, workspace_id, entity_type, entity_id, position, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
		id, workspaceID, entityType, entityID, pin.Position, now)
	if err != nil {
		return nil, err
	}
	return pin, nil
}

func DeletePin(db *pgxpool.Pool, workspaceID, pinID string) error {
	_, err := db.Exec(context.Background(),
		`DELETE FROM pins WHERE id = $1 AND workspace_id = $2`, pinID, workspaceID)
	return err
}

func ReorderPins(db *pgxpool.Pool, workspaceID string, positions map[string]float64) error {
	tx, err := db.Begin(context.Background())
	if err != nil {
		return err
	}
	defer tx.Rollback(context.Background())

	for entityID, pos := range positions {
		_, err := tx.Exec(context.Background(),
			`UPDATE pins SET position = $1 WHERE workspace_id = $2 AND entity_id = $3`,
			pos, workspaceID, entityID)
		if err != nil {
			return err
		}
	}
	return tx.Commit(context.Background())
}
