package service

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FileRecord struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	IssueID     string    `json:"issue_id"`
	CommentID   string    `json:"comment_id"`
	UploaderID  string    `json:"uploader_id"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	SizeBytes   int64     `json:"size_bytes"`
	StoragePath string    `json:"storage_path"`
	DownloadURL string    `json:"download_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type FileService struct {
	db      *pgxpool.Pool
	baseDir string
	baseURL string
}

func NewFileService(db *pgxpool.Pool, baseDir, baseURL string) *FileService {
	os.MkdirAll(baseDir, 0755)
	return &FileService{db: db, baseDir: baseDir, baseURL: baseURL}
}

func (s *FileService) Upload(ctx context.Context, workspaceID, issueID, commentID, uploaderID, filename, contentType string, size int64, reader io.Reader) (*FileRecord, error) {
	id := uuid.New().String()
	ext := filepath.Ext(filename)
	storagePath := filepath.Join(workspaceID, id+ext)
	fullPath := filepath.Join(s.baseDir, storagePath)

	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, reader); err != nil {
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to write file: %w", err)
	}

	now := time.Now()
	if commentID == "" {
		commentID = "00000000-0000-0000-0000-000000000000"
	}
	record := &FileRecord{
		ID: id, WorkspaceID: workspaceID, IssueID: issueID, CommentID: commentID, UploaderID: uploaderID,
		Filename: filename, ContentType: contentType, SizeBytes: size,
		StoragePath: storagePath, DownloadURL: fmt.Sprintf("%s/%s", s.baseURL, storagePath),
		CreatedAt: now,
	}

	_, err = s.db.Exec(ctx,
		`INSERT INTO files (id, workspace_id, issue_id, comment_id, uploader_id, filename, content_type, size_bytes, storage_path, download_url, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		record.ID, record.WorkspaceID, record.IssueID, record.CommentID, record.UploaderID, record.Filename,
		record.ContentType, record.SizeBytes, record.StoragePath, record.DownloadURL, record.CreatedAt)
	if err != nil {
		os.Remove(fullPath)
		return nil, err
	}

	return record, nil
}

func (s *FileService) Get(ctx context.Context, workspaceID, fileID string) (*FileRecord, error) {
	var f FileRecord
	err := s.db.QueryRow(ctx,
		`SELECT id, workspace_id, issue_id, COALESCE(comment_id,''), uploader_id, filename, content_type, size_bytes, storage_path, download_url, created_at
		 FROM files WHERE id = $1 AND workspace_id = $2`,
		fileID, workspaceID).Scan(&f.ID, &f.WorkspaceID, &f.IssueID, &f.CommentID,
		&f.UploaderID, &f.Filename, &f.ContentType, &f.SizeBytes, &f.StoragePath, &f.DownloadURL, &f.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (s *FileService) ListByIssue(ctx context.Context, workspaceID, issueID string) ([]FileRecord, error) {
	rows, err := s.db.Query(ctx,
		`SELECT id, workspace_id, issue_id, COALESCE(comment_id,''), uploader_id, filename, content_type, size_bytes, storage_path, download_url, created_at
		 FROM files WHERE workspace_id = $1 AND issue_id = $2 ORDER BY created_at DESC`,
		workspaceID, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []FileRecord
	for rows.Next() {
		var f FileRecord
		if err := rows.Scan(&f.ID, &f.WorkspaceID, &f.IssueID, &f.CommentID, &f.UploaderID,
			&f.Filename, &f.ContentType, &f.SizeBytes, &f.StoragePath, &f.DownloadURL, &f.CreatedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, nil
}

func (s *FileService) Delete(ctx context.Context, workspaceID, fileID string) error {
	var storagePath string
	err := s.db.QueryRow(ctx,
		`SELECT storage_path FROM files WHERE id = $1 AND workspace_id = $2`,
		fileID, workspaceID).Scan(&storagePath)
	if err != nil {
		return err
	}

	if _, err := s.db.Exec(ctx, `DELETE FROM files WHERE id = $1 AND workspace_id = $2`, fileID, workspaceID); err != nil {
		return err
	}

	fullPath := filepath.Join(s.baseDir, storagePath)
	os.Remove(fullPath)
	return nil
}

func (s *FileService) GetFilePath(storagePath string) string {
	return filepath.Join(s.baseDir, storagePath)
}

func (s *FileService) OpenFile(fullPath string) (*os.File, error) {
	return os.Open(fullPath)
}
