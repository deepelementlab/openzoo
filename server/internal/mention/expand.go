package mention

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type Issue struct {
	ID     string
	Number int32
}

type Workspace struct {
	IssuePrefix string
}

type IssueResolver interface {
	GetIssueByNumber(ctx context.Context, workspaceID string, number int32) (Issue, error)
}

type PrefixResolver interface {
	GetWorkspace(ctx context.Context, id string) (Workspace, error)
}

type Resolver interface {
	IssueResolver
	PrefixResolver
}

func ExpandIssueIdentifiers(ctx context.Context, resolver Resolver, workspaceID string, content string) string {
	ws, err := resolver.GetWorkspace(ctx, workspaceID)
	if err != nil || ws.IssuePrefix == "" {
		return content
	}
	prefix := ws.IssuePrefix

	pattern := regexp.MustCompile(`(?:^|(?:\W))` + `(` + regexp.QuoteMeta(prefix) + `-(\d+))` + `(?:\W|$)`)

	skipRegions := findSkipRegions(content)

	allMatches := pattern.FindAllStringSubmatchIndex(content, -1)
	if len(allMatches) == 0 {
		return content
	}

	type replacement struct {
		start, end int
		text       string
	}
	var replacements []replacement

	for _, match := range allMatches {
		identStart, identEnd := match[2], match[3]
		numStr := content[match[4]:match[5]]

		if inSkipRegion(identStart, skipRegions) {
			continue
		}

		if isInsideMarkdownLink(content, identStart, identEnd) {
			continue
		}

		num, err := strconv.Atoi(numStr)
		if err != nil || num <= 0 {
			continue
		}

		issue, err := resolver.GetIssueByNumber(ctx, workspaceID, int32(num))
		if err != nil {
			continue
		}

		identifier := content[identStart:identEnd]
		mentionLink := fmt.Sprintf("[%s](mention://issue/%s)", identifier, issue.ID)

		replacements = append(replacements, replacement{
			start: identStart,
			end:   identEnd,
			text:  mentionLink,
		})
	}

	if len(replacements) == 0 {
		return content
	}

	result := content
	for i := len(replacements) - 1; i >= 0; i-- {
		r := replacements[i]
		result = result[:r.start] + r.text + result[r.end:]
	}

	return result
}

type skipRegion struct {
	start, end int
}

func findSkipRegions(content string) []skipRegion {
	var regions []skipRegion

	fenceRe := regexp.MustCompile("(?m)^```[^`]*\n[\\s\\S]*?\n```")
	for _, loc := range fenceRe.FindAllStringIndex(content, -1) {
		regions = append(regions, skipRegion{loc[0], loc[1]})
	}

	inlineRe := regexp.MustCompile("`[^`\n]+`")
	for _, loc := range inlineRe.FindAllStringIndex(content, -1) {
		regions = append(regions, skipRegion{loc[0], loc[1]})
	}

	return regions
}

func inSkipRegion(pos int, regions []skipRegion) bool {
	for _, r := range regions {
		if pos >= r.start && pos < r.end {
			return true
		}
	}
	return false
}

func isInsideMarkdownLink(content string, start, end int) bool {
	if start > 0 {
		before := strings.TrimRight(content[:start], " ")
		if len(before) > 0 && before[len(before)-1] == '[' {
			return true
		}
	}
	after := content[end:]
	if strings.HasPrefix(after, "](") {
		return true
	}
	idx := strings.LastIndex(content[:start], "](")
	if idx >= 0 {
		between := content[idx:start]
		if !strings.Contains(between, ")") {
			return true
		}
	}
	return false
}
