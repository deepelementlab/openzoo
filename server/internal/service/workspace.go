package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkspaceService struct {
	db *pgxpool.Pool
}

func NewWorkspaceService(db *pgxpool.Pool) *WorkspaceService {
	return &WorkspaceService{db: db}
}

type Workspace struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  string    `json:"description"`
	Context      string    `json:"context"`
	IssuePrefix  string    `json:"issue_prefix"`
	IssueCounter int       `json:"issue_counter"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type WorkspaceRepo struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Branch      string     `json:"branch"`
	Provider    string     `json:"provider"`
	Status      string     `json:"status"`
	LastSynced  *time.Time `json:"last_synced"`
}

func (s *WorkspaceService) List(ctx context.Context) ([]Workspace, error) {
	rows, err := s.db.Query(ctx, `SELECT id, name, slug, description, context, issue_prefix, issue_counter, created_at, updated_at FROM workspaces ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ws := make([]Workspace, 0)
	for rows.Next() {
		var w Workspace
		if err := rows.Scan(&w.ID, &w.Name, &w.Slug, &w.Description, &w.Context, &w.IssuePrefix, &w.IssueCounter, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		ws = append(ws, w)
	}
	return ws, nil
}

func (s *WorkspaceService) Get(ctx context.Context, id string) (*Workspace, error) {
	var w Workspace
	err := s.db.QueryRow(ctx, `SELECT id, name, slug, description, context, issue_prefix, issue_counter, created_at, updated_at FROM workspaces WHERE id = $1`, id).
		Scan(&w.ID, &w.Name, &w.Slug, &w.Description, &w.Context, &w.IssuePrefix, &w.IssueCounter, &w.CreatedAt, &w.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func (s *WorkspaceService) Create(ctx context.Context, name, description, issuePrefix string) (*Workspace, error) {
	id := uuid.New().String()
	now := time.Now()
	slug := slugify(name)
	if issuePrefix == "" {
		issuePrefix = "OZ"
	}
	_, err := s.db.Exec(ctx, `INSERT INTO workspaces (id, name, slug, description, issue_prefix, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $6)`,
		id, name, slug, description, issuePrefix, now)
	if err != nil {
		return nil, err
	}
	return &Workspace{ID: id, Name: name, Slug: slug, Description: description, IssuePrefix: issuePrefix, CreatedAt: now, UpdatedAt: now}, nil
}

func (s *WorkspaceService) Update(ctx context.Context, id string, name, description, contextStr *string) (*Workspace, error) {
	now := time.Now()
	if name != nil {
		_, err := s.db.Exec(ctx, `UPDATE workspaces SET name = $2, updated_at = $3 WHERE id = $1`, id, *name, now)
		if err != nil {
			return nil, err
		}
	}
	if description != nil {
		_, err := s.db.Exec(ctx, `UPDATE workspaces SET description = $2, updated_at = $3 WHERE id = $1`, id, *description, now)
		if err != nil {
			return nil, err
		}
	}
	if contextStr != nil {
		_, err := s.db.Exec(ctx, `UPDATE workspaces SET context = $2, updated_at = $3 WHERE id = $1`, id, *contextStr, now)
		if err != nil {
			return nil, err
		}
	}
	return s.Get(ctx, id)
}

func (s *WorkspaceService) Delete(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM workspaces WHERE id = $1`, id)
	return err
}

func slugify(name string) string {
	s := make([]byte, 0, len(name))
	for _, c := range name {
		if c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c == '-' {
			s = append(s, byte(c))
		} else if c >= 'A' && c <= 'Z' {
			s = append(s, byte(c+32))
		} else if c == ' ' {
			s = append(s, '-')
		}
	}
	return string(s)
}

func (s *WorkspaceService) ListPins(workspaceID string) ([]Pin, error) {
	return ListPins(s.db, workspaceID)
}

func (s *WorkspaceService) CreatePin(workspaceID, entityType, entityID string) (*Pin, error) {
	return CreatePin(s.db, workspaceID, entityType, entityID)
}

func (s *WorkspaceService) DeletePin(workspaceID, pinID string) error {
	return DeletePin(s.db, workspaceID, pinID)
}

func (s *WorkspaceService) ReorderPins(workspaceID string, positions map[string]float64) error {
	return ReorderPins(s.db, workspaceID, positions)
}

func (s *WorkspaceService) ListRepos(ctx context.Context, workspaceID string) ([]WorkspaceRepo, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, workspace_id, name, url, branch, provider, status, last_synced FROM workspace_repos WHERE workspace_id = $1 ORDER BY name`,
		workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var repos []WorkspaceRepo
	for rows.Next() {
		var r WorkspaceRepo
		if err := rows.Scan(&r.ID, &r.WorkspaceID, &r.Name, &r.URL, &r.Branch, &r.Provider, &r.Status, &r.LastSynced); err != nil {
			return nil, err
		}
		repos = append(repos, r)
	}
	return repos, nil
}

func (s *WorkspaceService) AddRepo(ctx context.Context, workspaceID, rawURL, branch string) (*WorkspaceRepo, error) {
	id := uuid.New().String()
	name := extractRepoName(rawURL)
	provider := extractProvider(rawURL)
	if branch == "" {
		branch = "main"
	}
	_, err := s.db.Exec(ctx,
		`INSERT INTO workspace_repos (id, workspace_id, name, url, branch, provider, status) VALUES ($1, $2, $3, $4, $5, $6, 'connected')`,
		id, workspaceID, name, rawURL, branch, provider)
	if err != nil {
		return nil, err
	}
	return &WorkspaceRepo{
		ID:          id,
		WorkspaceID: workspaceID,
		Name:        name,
		URL:         rawURL,
		Branch:      branch,
		Provider:    provider,
		Status:      "connected",
	}, nil
}

func (s *WorkspaceService) RemoveRepo(ctx context.Context, workspaceID, repoID string) error {
	_, err := s.db.Exec(ctx, `DELETE FROM workspace_repos WHERE id = $1 AND workspace_id = $2`, repoID, workspaceID)
	return err
}

func (s *WorkspaceService) SyncRepo(ctx context.Context, workspaceID, repoID string) error {
	_, err := s.db.Exec(ctx,
		`UPDATE workspace_repos SET status = 'syncing' WHERE id = $1 AND workspace_id = $2`,
		repoID, workspaceID)
	if err != nil {
		return err
	}
	now := time.Now()
	_, err = s.db.Exec(ctx,
		`UPDATE workspace_repos SET status = 'connected', last_synced = $1 WHERE id = $2 AND workspace_id = $3`,
		now, repoID, workspaceID)
	return err
}

func extractRepoName(rawURL string) string {
	u := rawURL
	if strings.HasPrefix(u, "https://") {
		u = strings.TrimPrefix(u, "https://")
	} else if strings.HasPrefix(u, "http://") {
		u = strings.TrimPrefix(u, "http://")
	} else if strings.HasPrefix(u, "git@") {
		u = strings.TrimPrefix(u, "git@")
		u = strings.Replace(u, ":", "/", 1)
	}
	u = strings.TrimSuffix(u, ".git")
	parts := strings.Split(u, "/")
	if len(parts) >= 3 {
		return parts[len(parts)-2] + "/" + parts[len(parts)-1]
	}
	return rawURL
}

func extractProvider(rawURL string) string {
	lower := strings.ToLower(rawURL)
	if strings.Contains(lower, "github") {
		return "github"
	}
	if strings.Contains(lower, "gitlab") {
		return "gitlab"
	}
	if strings.Contains(lower, "bitbucket") {
		return "bitbucket"
	}
	return "generic"
}
