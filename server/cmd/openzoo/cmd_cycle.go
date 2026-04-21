package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var cycleCmd = &cobra.Command{
	Use:   "cycle",
	Short: "Work with cycles",
}

var cycleListCmd = &cobra.Command{
	Use:   "list",
	Short: "List cycles",
	RunE:  runCycleList,
}

var cycleCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new cycle",
	RunE:  runCycleCreate,
}

var cycleUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a cycle",
	Args:  exactArgs(1),
	RunE:  runCycleUpdate,
}

var cycleDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a cycle",
	Args:  exactArgs(1),
	RunE:  runCycleDelete,
}

var cycleAddIssueCmd = &cobra.Command{
	Use:   "add-issue <cycle-id> <issue-id>",
	Short: "Add an issue to a cycle",
	Args:  exactArgs(2),
	RunE:  runCycleAddIssue,
}

var cycleRemoveIssueCmd = &cobra.Command{
	Use:   "remove-issue <cycle-id> <issue-id>",
	Short: "Remove an issue from a cycle",
	Args:  exactArgs(2),
	RunE:  runCycleRemoveIssue,
}

var cycleIssuesCmd = &cobra.Command{
	Use:   "issues <cycle-id>",
	Short: "List issues in a cycle",
	Args:  exactArgs(1),
	RunE:  runCycleIssues,
}

func init() {
	cycleCmd.AddCommand(cycleListCmd)
	cycleCmd.AddCommand(cycleCreateCmd)
	cycleCmd.AddCommand(cycleUpdateCmd)
	cycleCmd.AddCommand(cycleDeleteCmd)
	cycleCmd.AddCommand(cycleAddIssueCmd)
	cycleCmd.AddCommand(cycleRemoveIssueCmd)
	cycleCmd.AddCommand(cycleIssuesCmd)

	cycleListCmd.Flags().String("output", "table", "Output format: table or json")

	cycleCreateCmd.Flags().String("name", "", "Cycle name (required)")
	cycleCreateCmd.Flags().String("description", "", "Cycle description")
	cycleCreateCmd.Flags().String("start-date", "", "Start date (YYYY-MM-DD)")
	cycleCreateCmd.Flags().String("end-date", "", "End date (YYYY-MM-DD)")
	cycleCreateCmd.Flags().Bool("auto-create-next", false, "Auto-create next cycle")
	cycleCreateCmd.Flags().String("output", "json", "Output format: table or json")

	cycleUpdateCmd.Flags().String("name", "", "New name")
	cycleUpdateCmd.Flags().String("description", "", "New description")
	cycleUpdateCmd.Flags().String("start-date", "", "New start date")
	cycleUpdateCmd.Flags().String("end-date", "", "New end date")
	cycleUpdateCmd.Flags().String("status", "", "New status")
	cycleUpdateCmd.Flags().Bool("auto-create-next", false, "New auto-create setting")
	cycleUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	cycleDeleteCmd.Flags().String("output", "json", "Output format: table or json")
	cycleAddIssueCmd.Flags().String("output", "json", "Output format: table or json")
	cycleRemoveIssueCmd.Flags().String("output", "json", "Output format: table or json")
	cycleIssuesCmd.Flags().String("output", "table", "Output format: table or json")
}

func runCycleList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}
	if client.workspaceID == "" {
		if _, err := requireWorkspaceID(cmd); err != nil {
			return err
		}
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/cycle/list", map[string]any{"workspace_id": client.workspaceID}, &result); err != nil {
		return fmt.Errorf("list cycles: %w", err)
	}

	cyclesRaw, _ := result["cycles"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, cyclesRaw)
	}

	headers := []string{"ID", "NAME", "STATUS", "NUMBER", "START", "END"}
	rows := make([][]string, 0, len(cyclesRaw))
	for _, raw := range cyclesRaw {
		c, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(c, "id")),
			strVal(c, "name"),
			strVal(c, "status"),
			fmt.Sprintf("#%d", int(getFloat(c, "number"))),
			strVal(c, "start_date"),
			strVal(c, "end_date"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runCycleCreate(cmd *cobra.Command, _ []string) error {
	name, _ := cmd.Flags().GetString("name")
	if name == "" {
		return fmt.Errorf("--name is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{
		"workspace_id": client.workspaceID,
		"name":         name,
	}
	if v, _ := cmd.Flags().GetString("description"); v != "" {
		body["description"] = v
	}
	if v, _ := cmd.Flags().GetString("start-date"); v != "" {
		body["start_date"] = v
	}
	if v, _ := cmd.Flags().GetString("end-date"); v != "" {
		body["end_date"] = v
	}
	if v, _ := cmd.Flags().GetBool("auto-create-next"); v {
		body["auto_create_next"] = true
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/cycle/create", body, &result); err != nil {
		return fmt.Errorf("create cycle: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Cycle created: %s (#%d)\n", strVal(result, "name"), int(getFloat(result, "number")))
	return nil
}

func runCycleUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"cycle_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}
	if cmd.Flags().Changed("start-date") {
		v, _ := cmd.Flags().GetString("start-date")
		body["start_date"] = v
	}
	if cmd.Flags().Changed("end-date") {
		v, _ := cmd.Flags().GetString("end-date")
		body["end_date"] = v
	}
	if cmd.Flags().Changed("status") {
		v, _ := cmd.Flags().GetString("status")
		body["status"] = v
	}
	if cmd.Flags().Changed("auto-create-next") {
		v, _ := cmd.Flags().GetBool("auto-create-next")
		body["auto_create_next"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/cycle/update", body, &result); err != nil {
		return fmt.Errorf("update cycle: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Cycle updated: %s\n", strVal(result, "name"))
	return nil
}

func runCycleDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/cycle/delete", map[string]any{"cycle_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete cycle: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Cycle %s deleted.\n", truncateID(args[0]))
	return nil
}

func runCycleAddIssue(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/cycle/add-issue", map[string]any{
		"cycle_id": args[0],
		"issue_id": args[1],
	}, nil); err != nil {
		return fmt.Errorf("add issue to cycle: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Issue added to cycle %s.\n", truncateID(args[0]))
	return nil
}

func runCycleRemoveIssue(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/cycle/remove-issue", map[string]any{
		"cycle_id": args[0],
		"issue_id": args[1],
	}, nil); err != nil {
		return fmt.Errorf("remove issue from cycle: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Issue removed from cycle %s.\n", truncateID(args[0]))
	return nil
}

func runCycleIssues(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/cycle/issues", map[string]any{"cycle_id": args[0]}, &result); err != nil {
		return fmt.Errorf("list cycle issues: %w", err)
	}

	issuesRaw, _ := result["issues"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, issuesRaw)
	}

	headers := []string{"ID", "TITLE", "STATUS", "PRIORITY"}
	rows := make([][]string, 0, len(issuesRaw))
	for _, raw := range issuesRaw {
		i, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(i, "id")),
			strVal(i, "title"),
			strVal(i, "status"),
			strVal(i, "priority"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func getFloat(m map[string]any, key string) float64 {
	v, _ := m[key].(float64)
	return v
}
