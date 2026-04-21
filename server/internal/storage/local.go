package storage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type LocalStorage struct {
	uploadDir string
	baseURL   string
}

func NewLocalStorageFromEnv() *LocalStorage {
	uploadDir := os.Getenv("LOCAL_UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./data/uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		slog.Error("failed to create upload directory", "dir", uploadDir, "error", err)
		return nil
	}
	baseURL := strings.TrimSuffix(os.Getenv("LOCAL_UPLOAD_BASE_URL"), "/")
	slog.Info("local storage initialized", "dir", uploadDir, "baseURL", baseURL)
	return &LocalStorage{
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

func (s *LocalStorage) KeyFromURL(rawURL string) string {
	if s.baseURL != "" && strings.HasPrefix(rawURL, s.baseURL) {
		rawURL = strings.TrimPrefix(rawURL, s.baseURL)
	}
	prefix := "/uploads/"
	if strings.HasPrefix(rawURL, prefix) {
		filename := strings.TrimPrefix(rawURL, prefix)
		if i := strings.LastIndex(filename, "/"); i >= 0 {
			return filename[i+1:]
		}
		return filename
	}
	if i := strings.LastIndex(rawURL, "/"); i >= 0 {
		return rawURL[i+1:]
	}
	return rawURL
}

func (s *LocalStorage) Delete(_ context.Context, key string) {
	if key == "" {
		return
	}
	filePath := filepath.Join(s.uploadDir, key)
	if err := os.Remove(filePath); err != nil {
		if !os.IsNotExist(err) {
			slog.Error("local storage Delete failed", "key", key, "error", err)
		}
	}
}

func (s *LocalStorage) DeleteKeys(ctx context.Context, keys []string) {
	for _, key := range keys {
		s.Delete(ctx, key)
	}
}

func (s *LocalStorage) Upload(_ context.Context, key string, data []byte, _ string, _ string) (string, error) {
	dir := filepath.Dir(filepath.Join(s.uploadDir, key))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("local storage MkdirAll: %w", err)
	}
	dest := filepath.Join(s.uploadDir, key)
	if err := os.WriteFile(dest, data, 0644); err != nil {
		return "", fmt.Errorf("local storage WriteFile: %w", err)
	}
	if s.baseURL != "" {
		return fmt.Sprintf("%s/uploads/%s", s.baseURL, key), nil
	}
	return fmt.Sprintf("/uploads/%s", key), nil
}

func (s *LocalStorage) UploadFromReader(ctx context.Context, key string, reader io.Reader, contentType string, filename string) (string, error) {
	data, err := io.ReadAll(reader)
	if err != nil {
		return "", fmt.Errorf("local storage ReadAll: %w", err)
	}
	return s.Upload(ctx, key, data, contentType, filename)
}

func (s *LocalStorage) ServeFile(w http.ResponseWriter, r *http.Request, filename string) {
	filePath := filepath.Join(s.uploadDir, filename)
	slog.Info("serving file", "filename", filename, "filepath", filePath)
	http.ServeFile(w, r, filePath)
}

func SanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, "..", "")
	name = strings.TrimSpace(name)
	if name == "" {
		name = "unnamed"
	}
	return name
}
