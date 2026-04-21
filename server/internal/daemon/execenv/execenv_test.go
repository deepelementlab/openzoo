package execenv

import (
	"strings"
	"testing"
)

func TestRepoNameFromURL(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"https://github.com/org/repo.git", "repo"},
		{"https://github.com/org/my-repo", "my-repo"},
		{"git@github.com:org/repo.git", "repo"},
		{"https://gitlab.com/group/project", "project"},
		{"repo", "repo"},
		{"", "repo"},
	}
	for _, tt := range tests {
		got := repoNameFromURL(tt.input)
		if got != tt.expected {
			t.Errorf("repoNameFromURL(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestTruncateID(t *testing.T) {
	got := truncateID("550e8400-e29b-41d4-a716-446655440000")
	if got != "550e8400" {
		t.Fatalf("expected 550e8400, got %s", got)
	}

	got = truncateID("abc")
	if got != "abc" {
		t.Fatalf("expected abc, got %s", got)
	}

	got = truncateID("")
	if got != "" {
		t.Fatalf("expected empty, got %s", got)
	}
}

func TestSanitizeName(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"My Agent", "my-agent"},
		{"claude-3.5", "claude-3-5"},
		{"  spaces  ", "spaces"},
		{"UPPERCASE", "uppercase"},
		{"a@b#c$d", "a-b-c-d"},
		{"", "agent"},
		{strings.Repeat("x", 50), strings.Repeat("x", 30)},
	}
	for _, tt := range tests {
		got := sanitizeName(tt.input)
		if got != tt.expected {
			t.Errorf("sanitizeName(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}

func TestDetectGitRepoNonExistent(t *testing.T) {
	_, ok := detectGitRepo("/nonexistent/path/that/does/not/exist")
	if ok {
		t.Fatal("expected false for nonexistent directory")
	}
}
