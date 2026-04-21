package mention

import (
	"context"
	"fmt"
	"testing"
)

type mockResolver struct {
	prefix string
	issues map[int32]Issue
}

func (m *mockResolver) GetWorkspace(_ context.Context, _ string) (Workspace, error) {
	return Workspace{IssuePrefix: m.prefix}, nil
}

func (m *mockResolver) GetIssueByNumber(_ context.Context, _ string, number int32) (Issue, error) {
	if issue, ok := m.issues[number]; ok {
		return issue, nil
	}
	return Issue{}, fmt.Errorf("not found")
}

func TestExpandIssueIdentifiers(t *testing.T) {
	ctx := context.Background()
	wsID := "ws-1"
	issueUUID := "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

	resolver := &mockResolver{
		prefix: "OZ",
		issues: map[int32]Issue{
			117: {ID: issueUUID, Number: 117},
		},
	}

	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name:  "basic replacement",
			input: "See OZ-117 for details",
			want:  "See [OZ-117](mention://issue/" + issueUUID + ") for details",
		},
		{
			name:  "at start of line",
			input: "OZ-117 is important",
			want:  "[OZ-117](mention://issue/" + issueUUID + ") is important",
		},
		{
			name:  "at end of line",
			input: "Check out OZ-117",
			want:  "Check out [OZ-117](mention://issue/" + issueUUID + ")",
		},
		{
			name:  "already a mention link",
			input: "[OZ-117](mention://issue/some-id)",
			want:  "[OZ-117](mention://issue/some-id)",
		},
		{
			name:  "inside inline code",
			input: "Run `OZ-117` to test",
			want:  "Run `OZ-117` to test",
		},
		{
			name:  "inside fenced code block",
			input: "```\nOZ-117\n```",
			want:  "```\nOZ-117\n```",
		},
		{
			name:  "non-existent issue unchanged",
			input: "See OZ-999 for details",
			want:  "See OZ-999 for details",
		},
		{
			name:  "no match",
			input: "No issues here",
			want:  "No issues here",
		},
		{
			name:  "already a markdown link text",
			input: "[OZ-117](https://example.com)",
			want:  "[OZ-117](https://example.com)",
		},
		{
			name:  "multiple references",
			input: "OZ-117 and also OZ-117 again",
			want:  "[OZ-117](mention://issue/" + issueUUID + ") and also [OZ-117](mention://issue/" + issueUUID + ") again",
		},
		{
			name:  "with parentheses",
			input: "(OZ-117)",
			want:  "([OZ-117](mention://issue/" + issueUUID + "))",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExpandIssueIdentifiers(ctx, resolver, wsID, tt.input)
			if got != tt.want {
				t.Errorf("ExpandIssueIdentifiers() =\n  %q\nwant:\n  %q", got, tt.want)
			}
		})
	}
}
