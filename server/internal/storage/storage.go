package storage

import (
	"context"
	"io"
	"net/http"
)

type Storage interface {
	Upload(ctx context.Context, key string, data []byte, contentType string, filename string) (string, error)
	UploadFromReader(ctx context.Context, key string, reader io.Reader, contentType string, filename string) (string, error)
	Delete(ctx context.Context, key string)
	DeleteKeys(ctx context.Context, keys []string)
	KeyFromURL(rawURL string) string
	ServeFile(w http.ResponseWriter, r *http.Request, filename string)
}
