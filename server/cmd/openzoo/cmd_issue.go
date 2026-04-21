package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var issueCmd = &cobra.Command{
	Use:   "issue",
	Short: "Work with issues",
}

var issueListCmd = &cobra.Command{
	Use:   "list",
	Short: "List issues in the workspace",
	RunE:  runIssueList,
}

var issueGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get issue details",
	Args:  exactArgs(1),
	RunE:  runIssueGet,
}

var issueCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new issue",
	RunE:  runIssueCreate,
}

var issueUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update an issue",
	Args:  exactArgs(1),
	RunE:  runIssueUpdate,
}

var issueAssignCmd = &cobra.Command{
	Use:   "assign <id>",
	Short: "Assign an issue to a member or agent",
	Args:  exactArgs(1),
	RunE:  runIssueAssign,
}

var issueStatusCmd = &cobra.Command{
	Use:   "status <id> <status>",
	Short: "Change issue status",
	Args:  exactArgs(2),
	RunE:  runIssueStatus,
}

var issueCommentCmd = &cobra.Command{
	Use:   "comment",
	Short: "Work with issue comments",
}

var issueCommentListCmd = &cobra.Command{
	Use:   "list <issue-id>",
	Short: "List comments on an issue",
	Args:  exactArgs(1),
	RunE:  runIssueCommentList,
}

var issueCommentAddCmd = &cobra.Command{
	Use:   "add <issue-id>",
	Short: "Add a comment to an issue",
	Args:  exactArgs(1),
	RunE:  runIssueCommentAdd,
}

var issueCommentDeleteCmd = &cobra.Command{
	Use:   "delete <comment-id>",
	Short: "Delete a comment",
	Args:  exactArgs(1),
	RunE:  runIssueCommentDelete,
}

var issueSearchCmd = &cobra.Command{
	Use:   "search <query>",
	Short: "Search issues by title or description",
	Args:  exactArgs(1),
	RunE:  runIssueSearch,
}

var validIssueStatuses = []string{
	"backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled",
}

func init() {
	issueCmd.AddCommand(issueListCmd)
	issueCmd.AddCommand(issueGetCmd)
	issueCmd.AddCommand(issueCreateCmd)
	issueCmd.AddCommand(issueUpdateCmd)
	issueCmd.AddCommand(issueAssignCmd)
	issueCmd.AddCommand(issueStatusCmd)
	issueCmd.AddCommand(issueCommentCmd)
	issueCmd.AddCommand(issueSearchCmd)

	issueCommentCmd.AddCommand(issueCommentListCmd)
	issueCommentCmd.AddCommand(issueCommentAddCmd)
	issueCommentCmd.AddCommand(issueCommentDeleteCmd)

	issueListCmd.Flags().String("output", "table", "Output format: table or json")
	issueListCmd.Flags().String("status", "", "Filter by status")
	issueListCmd.Flags().String("priority", "", "Filter by priority")
	issueListCmd.Flags().String("assignee", "", "Filter by assignee name")
	issueListCmd.Flags().String("project", "", "Filter by project ID")
	issueListCmd.Flags().Int("limit", 50, "Maximum number of issues to return")

	issueGetCmd.Flags().String("output", "json", "Output format: table or json")

	issueCreateCmd.Flags().String("title", "", "Issue title (required)")
	issueCreateCmd.Flags().String("description", "", "Issue description")
	issueCreateCmd.Flags().String("status", "", "Issue status")
	issueCreateCmd.Flags().String("priority", "", "Issue priority")
	issueCreateCmd.Flags().String("assignee", "", "Assignee name (member or agent)")
	issueCreateCmd.Flags().String("parent", "", "Parent issue ID")
	issueCreateCmd.Flags().String("project", "", "Project ID")
	issueCreateCmd.Flags().String("output", "json", "Output format: table or json")

	issueUpdateCmd.Flags().String("title", "", "New title")
	issueUpdateCmd.Flags().String("description", "", "New description")
	issueUpdateCmd.Flags().String("status", "", "New status")
	issueUpdateCmd.Flags().String("priority", "", "New priority")
	issueUpdateCmd.Flags().String("assignee", "", "New assignee name (member or agent)")
	issueUpdateCmd.Flags().String("project", "", "Project ID")
	issueUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	issueAssignCmd.Flags().String("to", "", "Assignee name (member or agent)")
	issueAssignCmd.Flags().Bool("unassign", false, "Remove current assignee")
	issueAssignCmd.Flags().String("output", "json", "Output format: table or json")

	issueCommentListCmd.Flags().String("output", "table", "Output format: table or json")

	issueCommentAddCmd.Flags().String("content", "", "Comment content (required)")
	issueCommentAddCmd.Flags().String("parent", "", "Parent comment ID (reply to a specific comment)")
	issueCommentAddCmd.Flags().String("output", "json", "Output format: table or json")

	issueSearchCmd.Flags().Int("limit", 20, "Maximum number of results to return")
	issueSearchCmd.Flags().Bool("include-closed", false, "Include done and cancelled issues")
	issueSearchCmd.Flags().String("output", "table", "Output format: table or json")
}

func runIssueList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if client.workspaceID == "" {
		if _, err := requireWorkspaceID(cmd); err != nil {
			return err
		}
	}

	body := map[string]any{
		"workspace_id": client.workspaceID,
	}
	if v, _ := cmd.Flags().GetString("status"); v != "" {
		body["status"] = v
	}
	if v, _ := cmd.Flags().GetString("priority"); v != "" {
		body["priority"] = v
	}
	if v, _ := cmd.Flags().GetInt("limit"); v > 0 {
		body["limit"] = v
	}
	if v, _ := cmd.Flags().GetString("assignee"); v != "" {
		_, aID, resolveErr := resolveAssignee(ctx, client, v)
		if resolveErr != nil {
			return fmt.Errorf("resolve assignee: %w", resolveErr)
		}
		body["assignee_id"] = aID
	}
	if v, _ := cmd.Flags().GetString("project"); v != "" {
		body["project_id"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/list", body, &result); err != nil {
		return fmt.Errorf("list issues: %w", err)
	}

	issuesRaw, _ := result["issues"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, issuesRaw)
	}

	headers := []string{"ID", "TITLE", "STATUS", "PRIORITY", "ASSIGNEE"}
	rows := make([][]string, 0, len(issuesRaw))
	for _, raw := range issuesRaw {
		issue, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		assignee := formatAssignee(issue)
		rows = append(rows, []string{
			truncateID(strVal(issue, "id")),
			strVal(issue, "title"),
			strVal(issue, "status"),
			strVal(issue, "priority"),
			assignee,
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runIssueGet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var issue map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/get", map[string]any{"issue_id": args[0]}, &issue); err != nil {
		return fmt.Errorf("get issue: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "table" {
		assignee := formatAssignee(issue)
		headers := []string{"ID", "TITLE", "STATUS", "PRIORITY", "ASSIGNEE", "DESCRIPTION"}
		rows := [][]string{{
			truncateID(strVal(issue, "id")),
			strVal(issue, "title"),
			strVal(issue, "status"),
			strVal(issue, "priority"),
			assignee,
			strVal(issue, "description"),
		}}
		printTable(os.Stdout, headers, rows)
		return nil
	}

	return printJSON(os.Stdout, issue)
}

func runIssueCreate(cmd *cobra.Command, _ []string) error {
	title, _ := cmd.Flags().GetString("title")
	if title == "" {
		return fmt.Errorf("--title is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"title": title}
	if v, _ := cmd.Flags().GetString("description"); v != "" {
		body["description"] = v
	}
	if v, _ := cmd.Flags().GetString("status"); v != "" {
		body["status"] = v
	}
	if v, _ := cmd.Flags().GetString("priority"); v != "" {
		body["priority"] = v
	}
	if v, _ := cmd.Flags().GetString("parent"); v != "" {
		body["parent_issue_id"] = v
	}
	if v, _ := cmd.Flags().GetString("project"); v != "" {
		body["project_id"] = v
	}
	if v, _ := cmd.Flags().GetString("assignee"); v != "" {
		aType, aID, resolveErr := resolveAssignee(ctx, client, v)
		if resolveErr != nil {
			return fmt.Errorf("resolve assignee: %w", resolveErr)
		}
		body["assignee_type"] = aType
		body["assignee_id"] = aID
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/create", body, &result); err != nil {
		return fmt.Errorf("create issue: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "table" {
		headers := []string{"ID", "TITLE", "STATUS", "PRIORITY"}
		rows := [][]string{{
			truncateID(strVal(result, "id")),
			strVal(result, "title"),
			strVal(result, "status"),
			strVal(result, "priority"),
		}}
		printTable(os.Stdout, headers, rows)
		return nil
	}

	return printJSON(os.Stdout, result)
}

func runIssueUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"issue_id": args[0]}
	if cmd.Flags().Changed("title") {
		v, _ := cmd.Flags().GetString("title")
		body["title"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}
	if cmd.Flags().Changed("status") {
		v, _ := cmd.Flags().GetString("status")
		body["status"] = v
	}
	if cmd.Flags().Changed("priority") {
		v, _ := cmd.Flags().GetString("priority")
		body["priority"] = v
	}
	if cmd.Flags().Changed("project") {
		v, _ := cmd.Flags().GetString("project")
		body["project_id"] = v
	}
	if cmd.Flags().Changed("assignee") {
		v, _ := cmd.Flags().GetString("assignee")
		aType, aID, resolveErr := resolveAssignee(ctx, client, v)
		if resolveErr != nil {
			return fmt.Errorf("resolve assignee: %w", resolveErr)
		}
		body["assignee_type"] = aType
		body["assignee_id"] = aID
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/update", body, &result); err != nil {
		return fmt.Errorf("update issue: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "table" {
		headers := []string{"ID", "TITLE", "STATUS", "PRIORITY"}
		rows := [][]string{{
			truncateID(strVal(result, "id")),
			strVal(result, "title"),
			strVal(result, "status"),
			strVal(result, "priority"),
		}}
		printTable(os.Stdout, headers, rows)
		return nil
	}

	return printJSON(os.Stdout, result)
}

func runIssueAssign(cmd *cobra.Command, args []string) error {
	toName, _ := cmd.Flags().GetString("to")
	unassign, _ := cmd.Flags().GetBool("unassign")

	if toName == "" && !unassign {
		return fmt.Errorf("provide --to <name> or --unassign")
	}
	if toName != "" && unassign {
		return fmt.Errorf("--to and --unassign are mutually exclusive")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"issue_id": args[0]}
	if unassign {
		body["assignee_type"] = nil
		body["assignee_id"] = nil
	} else {
		aType, aID, resolveErr := resolveAssignee(ctx, client, toName)
		if resolveErr != nil {
			return fmt.Errorf("resolve assignee: %w", resolveErr)
		}
		body["assignee_type"] = aType
		body["assignee_id"] = aID
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/update", body, &result); err != nil {
		return fmt.Errorf("assign issue: %w", err)
	}

	if unassign {
		fmt.Fprintf(os.Stderr, "Issue %s unassigned.\n", truncateID(args[0]))
	} else {
		fmt.Fprintf(os.Stderr, "Issue %s assigned to %s.\n", truncateID(args[0]), toName)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}
	return nil
}

func runIssueStatus(cmd *cobra.Command, args []string) error {
	id := args[0]
	status := args[1]

	valid := false
	for _, s := range validIssueStatuses {
		if s == status {
			valid = true
			break
		}
	}
	if !valid {
		return fmt.Errorf("invalid status %q; valid values: %s", status, strings.Join(validIssueStatuses, ", "))
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"issue_id": id, "status": status}
	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/update", body, &result); err != nil {
		return fmt.Errorf("update status: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Issue %s status changed to %s.\n", truncateID(id), status)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}
	return nil
}

func runIssueCommentList(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var comments map[string]any
	if err := client.postJSON(ctx, "/rpc/comment/list", map[string]any{"issue_id": args[0]}, &comments); err != nil {
		return fmt.Errorf("list comments: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, comments)
	}

	commentsRaw, _ := comments["comments"].([]any)
	headers := []string{"ID", "AUTHOR", "CONTENT", "CREATED"}
	rows := make([][]string, 0, len(commentsRaw))
	for _, c := range commentsRaw {
		cm, ok := c.(map[string]any)
		if !ok {
			continue
		}
		content := strVal(cm, "content")
		if len(content) > 80 {
			content = content[:77] + "..."
		}
		rows = append(rows, []string{
			strVal(cm, "id"),
			strVal(cm, "author_name"),
			content,
			strVal(cm, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runIssueCommentAdd(cmd *cobra.Command, args []string) error {
	content, _ := cmd.Flags().GetString("content")
	if content == "" {
		return fmt.Errorf("--content is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{
		"issue_id": args[0],
		"content":  content,
	}
	if parentID, _ := cmd.Flags().GetString("parent"); parentID != "" {
		body["parent_id"] = parentID
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/comment/create", body, &result); err != nil {
		return fmt.Errorf("add comment: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Comment added to issue %s.\n", truncateID(args[0]))

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}
	return nil
}

func runIssueCommentDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/comment/delete", map[string]any{"comment_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete comment: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Comment %s deleted.\n", truncateID(args[0]))
	return nil
}

func runIssueSearch(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"query": args[0]}
	if v, _ := cmd.Flags().GetInt("limit"); v > 0 {
		body["limit"] = v
	}
	if v, _ := cmd.Flags().GetBool("include-closed"); v {
		body["include_closed"] = true
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/issue/search", body, &result); err != nil {
		return fmt.Errorf("search issues: %w", err)
	}

	issuesRaw, _ := result["issues"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	headers := []string{"ID", "TITLE", "STATUS", "MATCH"}
	rows := make([][]string, 0, len(issuesRaw))
	for _, raw := range issuesRaw {
		issue, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(issue, "id")),
			strVal(issue, "title"),
			strVal(issue, "status"),
			strVal(issue, "match_source"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

type assigneeMatch struct {
	Type string
	ID   string
	Name string
}

func resolveAssignee(ctx context.Context, client *apiClient, name string) (string, string, error) {
	if client.workspaceID == "" {
		return "", "", fmt.Errorf("workspace ID is required to resolve assignees; use --workspace-id or set OPENZOO_WORKSPACE_ID")
	}

	nameLower := strings.ToLower(name)
	var matches []assigneeMatch

	var members map[string]any
	if err := client.postJSON(ctx, "/rpc/member/list", map[string]any{"workspace_id": client.workspaceID}, &members); err == nil {
		membersRaw, _ := members["members"].([]any)
		for _, m := range membersRaw {
			mm, ok := m.(map[string]any)
			if !ok {
				continue
			}
			mName := strVal(mm, "name")
			if strings.Contains(strings.ToLower(mName), nameLower) {
				matches = append(matches, assigneeMatch{
					Type: "member",
					ID:   strVal(mm, "user_id"),
					Name: mName,
				})
			}
		}
	}

	var agents map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/list", map[string]any{"workspace_id": client.workspaceID}, &agents); err == nil {
		agentsRaw, _ := agents["agents"].([]any)
		for _, a := range agentsRaw {
			aa, ok := a.(map[string]any)
			if !ok {
				continue
			}
			aName := strVal(aa, "name")
			if strings.Contains(strings.ToLower(aName), nameLower) {
				matches = append(matches, assigneeMatch{
					Type: "agent",
					ID:   strVal(aa, "id"),
					Name: aName,
				})
			}
		}
	}

	if len(matches) == 0 {
		return "", "", fmt.Errorf("no member or agent found matching %q", name)
	}
	if len(matches) == 1 {
		return matches[0].Type, matches[0].ID, nil
	}

	var parts []string
	for _, m := range matches {
		parts = append(parts, fmt.Sprintf("  %s %q (%s)", m.Type, m.Name, truncateID(m.ID)))
	}
	return "", "", fmt.Errorf("ambiguous assignee %q; matches:\n%s", name, strings.Join(parts, "\n"))
}

func formatAssignee(issue map[string]any) string {
	aType := strVal(issue, "assignee_type")
	aID := strVal(issue, "assignee_id")
	if aType == "" || aID == "" {
		return ""
	}
	return aType + ":" + truncateID(aID)
}
