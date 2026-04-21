package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var viewCmd = &cobra.Command{
	Use:   "view",
	Short: "Work with views",
}

var viewListCmd = &cobra.Command{
	Use:   "list",
	Short: "List views",
	RunE:  runViewList,
}

var viewCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new view",
	RunE:  runViewCreate,
}

var viewUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a view",
	Args:  exactArgs(1),
	RunE:  runViewUpdate,
}

var viewDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a view",
	Args:  exactArgs(1),
	RunE:  runViewDelete,
}

func init() {
	viewCmd.AddCommand(viewListCmd)
	viewCmd.AddCommand(viewCreateCmd)
	viewCmd.AddCommand(viewUpdateCmd)
	viewCmd.AddCommand(viewDeleteCmd)

	viewListCmd.Flags().String("output", "table", "Output format: table or json")

	viewCreateCmd.Flags().String("name", "", "View name (required)")
	viewCreateCmd.Flags().String("description", "", "View description")
	viewCreateCmd.Flags().Bool("shared", false, "Share with workspace")
	viewCreateCmd.Flags().String("output", "json", "Output format: table or json")

	viewUpdateCmd.Flags().String("name", "", "New name")
	viewUpdateCmd.Flags().String("description", "", "New description")
	viewUpdateCmd.Flags().Bool("shared", false, "New shared setting")
	viewUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	viewDeleteCmd.Flags().String("output", "json", "Output format: table or json")
}

func runViewList(cmd *cobra.Command, _ []string) error {
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
	if err := client.postJSON(ctx, "/rpc/view/list", map[string]any{"workspace_id": client.workspaceID}, &result); err != nil {
		return fmt.Errorf("list views: %w", err)
	}

	viewsRaw, _ := result["views"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, viewsRaw)
	}

	headers := []string{"ID", "NAME", "SHARED", "DESCRIPTION"}
	rows := make([][]string, 0, len(viewsRaw))
	for _, raw := range viewsRaw {
		v, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		shared := ""
		if s, _ := v["is_shared"].(bool); s {
			shared = "yes"
		}
		rows = append(rows, []string{
			truncateID(strVal(v, "id")),
			strVal(v, "name"),
			shared,
			strVal(v, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runViewCreate(cmd *cobra.Command, _ []string) error {
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
	if v, _ := cmd.Flags().GetBool("shared"); v {
		body["is_shared"] = true
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/view/create", body, &result); err != nil {
		return fmt.Errorf("create view: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "View created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runViewUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"view_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}
	if cmd.Flags().Changed("shared") {
		v, _ := cmd.Flags().GetBool("shared")
		body["is_shared"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/view/update", body, &result); err != nil {
		return fmt.Errorf("update view: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "View updated: %s\n", strVal(result, "name"))
	return nil
}

func runViewDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/view/delete", map[string]any{"view_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete view: %w", err)
	}

	fmt.Fprintf(os.Stderr, "View %s deleted.\n", truncateID(args[0]))
	return nil
}
