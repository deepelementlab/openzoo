package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var labelCmd = &cobra.Command{
	Use:   "label",
	Short: "Work with labels",
}

var labelListCmd = &cobra.Command{
	Use:   "list",
	Short: "List labels",
	RunE:  runLabelList,
}

var labelCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new label",
	RunE:  runLabelCreate,
}

var labelDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a label",
	Args:  exactArgs(1),
	RunE:  runLabelDelete,
}

var labelAddCmd = &cobra.Command{
	Use:   "add <issue-id> <label-id>",
	Short: "Add a label to an issue",
	Args:  exactArgs(2),
	RunE:  runLabelAdd,
}

var labelRemoveCmd = &cobra.Command{
	Use:   "remove <issue-id> <label-id>",
	Short: "Remove a label from an issue",
	Args:  exactArgs(2),
	RunE:  runLabelRemove,
}

var labelIssueCmd = &cobra.Command{
	Use:   "issue <issue-id>",
	Short: "List labels on an issue",
	Args:  exactArgs(1),
	RunE:  runLabelIssue,
}

func init() {
	labelCmd.AddCommand(labelListCmd)
	labelCmd.AddCommand(labelCreateCmd)
	labelCmd.AddCommand(labelDeleteCmd)
	labelCmd.AddCommand(labelAddCmd)
	labelCmd.AddCommand(labelRemoveCmd)
	labelCmd.AddCommand(labelIssueCmd)

	labelListCmd.Flags().String("output", "table", "Output format: table or json")

	labelCreateCmd.Flags().String("name", "", "Label name (required)")
	labelCreateCmd.Flags().String("description", "", "Label description")
	labelCreateCmd.Flags().String("color", "#6366f1", "Label color")
	labelCreateCmd.Flags().String("output", "json", "Output format: table or json")

	labelDeleteCmd.Flags().String("output", "json", "Output format: table or json")

	labelAddCmd.Flags().String("output", "json", "Output format: table or json")
	labelRemoveCmd.Flags().String("output", "json", "Output format: table or json")

	labelIssueCmd.Flags().String("output", "table", "Output format: table or json")
}

func runLabelList(cmd *cobra.Command, _ []string) error {
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
	if err := client.postJSON(ctx, "/rpc/label/list", map[string]any{"workspace_id": client.workspaceID}, &result); err != nil {
		return fmt.Errorf("list labels: %w", err)
	}

	labelsRaw, _ := result["labels"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, labelsRaw)
	}

	headers := []string{"ID", "NAME", "COLOR", "DESCRIPTION"}
	rows := make([][]string, 0, len(labelsRaw))
	for _, raw := range labelsRaw {
		l, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(l, "id")),
			strVal(l, "name"),
			strVal(l, "color"),
			strVal(l, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runLabelCreate(cmd *cobra.Command, _ []string) error {
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
	if v, _ := cmd.Flags().GetString("color"); v != "" {
		body["color"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/label/create", body, &result); err != nil {
		return fmt.Errorf("create label: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Label created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runLabelDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/label/delete", map[string]any{"label_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete label: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Label %s deleted.\n", truncateID(args[0]))
	return nil
}

func runLabelAdd(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/label/add-to-issue", map[string]any{
		"issue_id": args[0],
		"label_id": args[1],
	}, nil); err != nil {
		return fmt.Errorf("add label to issue: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Label added to issue %s.\n", truncateID(args[0]))
	return nil
}

func runLabelRemove(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/label/remove-from-issue", map[string]any{
		"issue_id": args[0],
		"label_id": args[1],
	}, nil); err != nil {
		return fmt.Errorf("remove label from issue: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Label removed from issue %s.\n", truncateID(args[0]))
	return nil
}

func runLabelIssue(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/label/issue-labels", map[string]any{"issue_id": args[0]}, &result); err != nil {
		return fmt.Errorf("list issue labels: %w", err)
	}

	labelsRaw, _ := result["labels"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, labelsRaw)
	}

	headers := []string{"ID", "NAME", "COLOR", "DESCRIPTION"}
	rows := make([][]string, 0, len(labelsRaw))
	for _, raw := range labelsRaw {
		l, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(l, "id")),
			strVal(l, "name"),
			strVal(l, "color"),
			strVal(l, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}
