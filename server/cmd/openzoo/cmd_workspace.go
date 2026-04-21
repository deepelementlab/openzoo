package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var workspaceCmd = &cobra.Command{
	Use:   "workspace",
	Short: "Work with workspaces",
}

var workspaceListCmd = &cobra.Command{
	Use:   "list",
	Short: "List workspaces",
	RunE:  runWorkspaceList,
}

var workspaceCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new workspace",
	RunE:  runWorkspaceCreate,
}

var workspaceUseCmd = &cobra.Command{
	Use:   "use <id>",
	Short: "Set the default workspace",
	Args:  exactArgs(1),
	RunE:  runWorkspaceUse,
}

func init() {
	workspaceCmd.AddCommand(workspaceListCmd)
	workspaceCmd.AddCommand(workspaceCreateCmd)
	workspaceCmd.AddCommand(workspaceUseCmd)

	workspaceListCmd.Flags().String("output", "table", "Output format: table or json")

	workspaceCreateCmd.Flags().String("name", "", "Workspace name (required)")
	workspaceCreateCmd.Flags().String("description", "", "Workspace description")
	workspaceCreateCmd.Flags().String("output", "json", "Output format: table or json")
}

func runWorkspaceList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/workspace/list", nil, &result); err != nil {
		return fmt.Errorf("list workspaces: %w", err)
	}

	workspacesRaw, _ := result["workspaces"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, workspacesRaw)
	}

	headers := []string{"ID", "NAME", "DESCRIPTION"}
	rows := make([][]string, 0, len(workspacesRaw))
	for _, raw := range workspacesRaw {
		ws, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			strVal(ws, "id"),
			strVal(ws, "name"),
			strVal(ws, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runWorkspaceCreate(cmd *cobra.Command, _ []string) error {
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

	body := map[string]any{"name": name}
	if v, _ := cmd.Flags().GetString("description"); v != "" {
		body["description"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/workspace/create", body, &result); err != nil {
		return fmt.Errorf("create workspace: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Workspace created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runWorkspaceUse(cmd *cobra.Command, args []string) error {
	workspaceID := args[0]

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var ws map[string]any
	if err := client.postJSON(ctx, "/rpc/workspace/get", map[string]any{"workspace_id": workspaceID}, &ws); err != nil {
		return fmt.Errorf("get workspace: %w", err)
	}

	profile := resolveProfile(cmd)
	cfg, _ := loadCLIConfigForProfile(profile)
	cfg.WorkspaceID = workspaceID
	if err := saveCLIConfigForProfile(cfg, profile); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Default workspace set to: %s (%s)\n", strVal(ws, "name"), workspaceID)
	return nil
}
