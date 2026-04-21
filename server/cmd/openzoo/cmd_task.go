package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var taskCmd = &cobra.Command{
	Use:   "task",
	Short: "Work with tasks",
}

var taskListCmd = &cobra.Command{
	Use:   "list",
	Short: "List tasks",
	RunE:  runTaskList,
}

var taskCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new task",
	RunE:  runTaskCreate,
}

var taskUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a task",
	Args:  exactArgs(1),
	RunE:  runTaskUpdate,
}

var taskGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get task details",
	Args:  exactArgs(1),
	RunE:  runTaskGet,
}

func init() {
	taskCmd.AddCommand(taskListCmd)
	taskCmd.AddCommand(taskCreateCmd)
	taskCmd.AddCommand(taskUpdateCmd)
	taskCmd.AddCommand(taskGetCmd)

	taskListCmd.Flags().String("output", "table", "Output format: table or json")
	taskListCmd.Flags().String("agent-id", "", "Filter by agent ID")
	taskListCmd.Flags().String("issue-id", "", "Filter by issue ID")
	taskListCmd.Flags().String("status", "", "Filter by status")

	taskCreateCmd.Flags().String("issue-id", "", "Issue ID (required)")
	taskCreateCmd.Flags().String("agent-id", "", "Agent ID")
	taskCreateCmd.Flags().String("output", "json", "Output format: table or json")

	taskUpdateCmd.Flags().String("status", "", "New task status")
	taskUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	taskGetCmd.Flags().String("output", "json", "Output format: table or json")
}

func runTaskList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{}
	if v, _ := cmd.Flags().GetString("agent-id"); v != "" {
		body["agent_id"] = v
	}
	if v, _ := cmd.Flags().GetString("issue-id"); v != "" {
		body["issue_id"] = v
	}
	if v, _ := cmd.Flags().GetString("status"); v != "" {
		body["status"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/task/list", body, &result); err != nil {
		return fmt.Errorf("list tasks: %w", err)
	}

	tasksRaw, _ := result["tasks"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, tasksRaw)
	}

	headers := []string{"ID", "ISSUE_ID", "STATUS", "CREATED"}
	rows := make([][]string, 0, len(tasksRaw))
	for _, raw := range tasksRaw {
		t, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(t, "id")),
			truncateID(strVal(t, "issue_id")),
			strVal(t, "status"),
			strVal(t, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runTaskCreate(cmd *cobra.Command, _ []string) error {
	issueID, _ := cmd.Flags().GetString("issue-id")
	if issueID == "" {
		return fmt.Errorf("--issue-id is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"issue_id": issueID}
	if v, _ := cmd.Flags().GetString("agent-id"); v != "" {
		body["agent_id"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/task/create", body, &result); err != nil {
		return fmt.Errorf("create task: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Task created for issue %s (%s)\n", truncateID(issueID), strVal(result, "id"))
	return nil
}

func runTaskUpdate(cmd *cobra.Command, args []string) error {
	status, _ := cmd.Flags().GetString("status")
	if status == "" {
		return fmt.Errorf("--status is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/task/update-status", map[string]any{
		"task_id": args[0],
		"status":  status,
	}, &result); err != nil {
		return fmt.Errorf("update task: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Task %s status updated to %s.\n", truncateID(args[0]), status)
	return nil
}

func runTaskGet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/task/get", map[string]any{"task_id": args[0]}, &result); err != nil {
		return fmt.Errorf("get task: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	headers := []string{"ID", "ISSUE_ID", "STATUS", "CREATED"}
	rows := [][]string{{
		strVal(result, "id"),
		strVal(result, "issue_id"),
		strVal(result, "status"),
		strVal(result, "created_at"),
	}}
	printTable(os.Stdout, headers, rows)
	return nil
}
