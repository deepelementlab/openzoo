package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var projectCmd = &cobra.Command{
	Use:   "project",
	Short: "Work with projects",
}

var projectListCmd = &cobra.Command{
	Use:   "list",
	Short: "List projects",
	RunE:  runProjectList,
}

var projectCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new project",
	RunE:  runProjectCreate,
}

var projectUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a project",
	Args:  exactArgs(1),
	RunE:  runProjectUpdate,
}

var projectDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a project",
	Args:  exactArgs(1),
	RunE:  runProjectDelete,
}

func init() {
	projectCmd.AddCommand(projectListCmd)
	projectCmd.AddCommand(projectCreateCmd)
	projectCmd.AddCommand(projectUpdateCmd)
	projectCmd.AddCommand(projectDeleteCmd)

	projectListCmd.Flags().String("output", "table", "Output format: table or json")
	projectListCmd.Flags().String("workspace-id", "", "Workspace ID")

	projectCreateCmd.Flags().String("name", "", "Project name (required)")
	projectCreateCmd.Flags().String("description", "", "Project description")
	projectCreateCmd.Flags().String("workspace-id", "", "Workspace ID")
	projectCreateCmd.Flags().String("output", "json", "Output format: table or json")

	projectUpdateCmd.Flags().String("name", "", "New name")
	projectUpdateCmd.Flags().String("description", "", "New description")
	projectUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	projectDeleteCmd.Flags().String("output", "json", "Output format: table or json")
}

func runProjectList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	workspaceID := resolveWorkspaceID(cmd)
	if v, _ := cmd.Flags().GetString("workspace-id"); v != "" {
		workspaceID = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/project/list", map[string]any{"workspace_id": workspaceID}, &result); err != nil {
		return fmt.Errorf("list projects: %w", err)
	}

	projectsRaw, _ := result["projects"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, projectsRaw)
	}

	headers := []string{"ID", "NAME", "DESCRIPTION", "STATUS"}
	rows := make([][]string, 0, len(projectsRaw))
	for _, raw := range projectsRaw {
		p, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(p, "id")),
			strVal(p, "name"),
			strVal(p, "description"),
			strVal(p, "status"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runProjectCreate(cmd *cobra.Command, _ []string) error {
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

	workspaceID := resolveWorkspaceID(cmd)
	if v, _ := cmd.Flags().GetString("workspace-id"); v != "" {
		workspaceID = v
	}

	body := map[string]any{
		"name":         name,
		"workspace_id": workspaceID,
	}
	if v, _ := cmd.Flags().GetString("description"); v != "" {
		body["description"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/project/create", body, &result); err != nil {
		return fmt.Errorf("create project: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Project created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runProjectUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"project_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/project/update", body, &result); err != nil {
		return fmt.Errorf("update project: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Project updated: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runProjectDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/project/delete", map[string]any{"project_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete project: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Project %s deleted.\n", truncateID(args[0]))
	return nil
}
