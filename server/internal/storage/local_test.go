package storage

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLocalStorageUploadAndDelete(t *testing.T) {
	dir := t.TempDir()
	s := &LocalStorage{uploadDir: dir, baseURL: "http://localhost:8080"}

	url, err := s.Upload(context.Background(), "test/file.txt", []byte("hello"), "text/plain", "file.txt")
	if err != nil {
		t.Fatalf("Upload failed: %v", err)
	}
	expected := "http://localhost:8080/uploads/test/file.txt"
	if url != expected {
		t.Fatalf("expected %s, got %s", expected, url)
	}

	data, err := os.ReadFile(filepath.Join(dir, "test", "file.txt"))
	if err != nil {
		t.Fatalf("file not created: %v", err)
	}
	if string(data) != "hello" {
		t.Fatalf("expected hello, got %s", data)
	}

	s.Delete(context.Background(), "test/file.txt")
	if _, err := os.Stat(filepath.Join(dir, "test", "file.txt")); !os.IsNotExist(err) {
		t.Fatal("file should be deleted")
	}
}

func TestLocalStorageDeleteEmpty(t *testing.T) {
	s := &LocalStorage{uploadDir: t.TempDir()}
	s.Delete(context.Background(), "")
}

func TestLocalStorageDeleteKeys(t *testing.T) {
	dir := t.TempDir()
	s := &LocalStorage{uploadDir: dir}
	s.Upload(context.Background(), "a.txt", []byte("a"), "text/plain", "a.txt")
	s.Upload(context.Background(), "b.txt", []byte("b"), "text/plain", "b.txt")
	s.DeleteKeys(context.Background(), []string{"a.txt", "b.txt"})
}

func TestLocalStorageKeyFromURL(t *testing.T) {
	s := &LocalStorage{baseURL: "http://localhost:8080"}
	tests := []struct {
		input    string
		expected string
	}{
		{"http://localhost:8080/uploads/abc123.png", "abc123.png"},
		{"/uploads/abc123.png", "abc123.png"},
		{"https://cdn.example.com/uploads/dir/abc123.png", "abc123.png"},
		{"abc123.png", "abc123.png"},
	}
	for _, tt := range tests {
		got := s.KeyFromURL(tt.input)
		if got != tt.expected {
			t.Errorf("KeyFromURL(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestLocalStorageUploadFromReader(t *testing.T) {
	dir := t.TempDir()
	s := &LocalStorage{uploadDir: dir}
	url, err := s.UploadFromReader(context.Background(), "test.txt", strings.NewReader("content"), "text/plain", "test.txt")
	if err != nil {
		t.Fatalf("UploadFromReader failed: %v", err)
	}
	if url != "/uploads/test.txt" {
		t.Fatalf("unexpected url: %s", url)
	}
}

func TestNewLocalStorageFromEnv(t *testing.T) {
	dir := t.TempDir()
	os.Setenv("LOCAL_UPLOAD_DIR", dir)
	defer os.Unsetenv("LOCAL_UPLOAD_DIR")

	s := NewLocalStorageFromEnv()
	if s == nil {
		t.Fatal("expected non-nil LocalStorage")
	}
	if s.uploadDir != dir {
		t.Fatalf("expected %s, got %s", dir, s.uploadDir)
	}
}

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"normal.txt", "normal.txt"},
		{"", "unnamed"},
	}
	for _, tt := range tests {
		got := SanitizeFilename(tt.input)
		if got != tt.expected {
			t.Errorf("SanitizeFilename(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
