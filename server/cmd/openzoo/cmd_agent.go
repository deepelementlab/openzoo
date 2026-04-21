package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var agentCmd = &cobra.Command{
	Use:   "agent",
	Short: "Work with agents",
}

var agentListCmd = &cobra.Command{
	Use:   "list",
	Short: "List agents in the workspace",
	RunE:  runAgentList,
}

var agentGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get agent details",
	Args:  exactArgs(1),
	RunE:  runAgentGet,
}

var agentCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new agent",
	RunE:  runAgentCreate,
}

var agentUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update an agent",
	Args:  exactArgs(1),
	RunE:  runAgentUpdate,
}

var agentArchiveCmd = &cobra.Command{
	Use:   "archive <id>",
	Short: "Archive an agent",
	Args:  exactArgs(1),
	RunE:  runAgentArchive,
}

var agentRestoreCmd = &cobra.Command{
	Use:   "restore <id>",
	Short: "Restore an archived agent",
	Args:  exactArgs(1),
	RunE:  runAgentRestore,
}

var agentTasksCmd = &cobra.Command{
	Use:   "tasks <id>",
	Short: "List tasks for an agent",
	Args:  exactArgs(1),
	RunE:  runAgentTasks,
}

var agentSkillsCmd = &cobra.Command{
	Use:   "skills",
	Short: "Manage agent skill assignments",
}

var agentSkillsListCmd = &cobra.Command{
	Use:   "list <agent-id>",
	Short: "List skills assigned to an agent",
	Args:  exactArgs(1),
	RunE:  runAgentSkillsList,
}

var agentSkillsSetCmd = &cobra.Command{
	Use:   "set <agent-id>",
	Short: "Set skills for an agent (replaces all current assignments)",
	Args:  exactArgs(1),
	RunE:  runAgentSkillsSet,
}

func init() {
	agentCmd.AddCommand(agentListCmd)
	agentCmd.AddCommand(agentGetCmd)
	agentCmd.AddCommand(agentCreateCmd)
	agentCmd.AddCommand(agentUpdateCmd)
	agentCmd.AddCommand(agentArchiveCmd)
	agentCmd.AddCommand(agentRestoreCmd)
	agentCmd.AddCommand(agentTasksCmd)
	agentCmd.AddCommand(agentSkillsCmd)

	agentSkillsCmd.AddCommand(agentSkillsListCmd)
	agentSkillsCmd.AddCommand(agentSkillsSetCmd)

	agentListCmd.Flags().String("output", "table", "Output format: table or json")
	agentListCmd.Flags().Bool("include-archived", false, "Include archived agents")

	agentGetCmd.Flags().String("output", "json", "Output format: table or json")

	agentCreateCmd.Flags().String("name", "", "Agent name (required)")
	agentCreateCmd.Flags().String("description", "", "Agent description")
	agentCreateCmd.Flags().String("instructions", "", "Agent instructions")
	agentCreateCmd.Flags().String("runtime-id", "", "Runtime ID")
	agentCreateCmd.Flags().String("visibility", "private", "Visibility: private or workspace")
	agentCreateCmd.Flags().Int32("max-concurrent-tasks", 6, "Maximum concurrent tasks")
	agentCreateCmd.Flags().String("output", "json", "Output format: table or json")

	agentUpdateCmd.Flags().String("name", "", "New name")
	agentUpdateCmd.Flags().String("description", "", "New description")
	agentUpdateCmd.Flags().String("instructions", "", "New instructions")
	agentUpdateCmd.Flags().String("runtime-id", "", "New runtime ID")
	agentUpdateCmd.Flags().String("visibility", "", "New visibility: private or workspace")
	agentUpdateCmd.Flags().String("status", "", "New status")
	agentUpdateCmd.Flags().Int32("max-concurrent-tasks", 0, "New max concurrent tasks")
	agentUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	agentArchiveCmd.Flags().String("output", "json", "Output format: table or json")

	agentRestoreCmd.Flags().String("output", "json", "Output format: table or json")

	agentTasksCmd.Flags().String("output", "table", "Output format: table or json")

	agentSkillsListCmd.Flags().String("output", "table", "Output format: table or json")

	agentSkillsSetCmd.Flags().StringSlice("skill-ids", nil, "Skill IDs to assign (comma-separated)")
	agentSkillsSetCmd.Flags().String("output", "json", "Output format: table or json")
}

func runAgentList(cmd *cobra.Command, _ []string) error {
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

	var agents map[string]any
	body := map[string]any{"workspace_id": client.workspaceID}
	if v, _ := cmd.Flags().GetBool("include-archived"); v {
		body["include_archived"] = true
	}
	if err := client.postJSON(ctx, "/rpc/agent/list", body, &agents); err != nil {
		return fmt.Errorf("list agents: %w", err)
	}

	agentsRaw, _ := agents["agents"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, agentsRaw)
	}

	headers := []string{"ID", "NAME", "STATUS", "RUNTIME", "ARCHIVED"}
	rows := make([][]string, 0, len(agentsRaw))
	for _, raw := range agentsRaw {
		a, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		archived := ""
		if v := strVal(a, "archived_at"); v != "" {
			archived = "yes"
		}
		rows = append(rows, []string{
			strVal(a, "id"),
			strVal(a, "name"),
			strVal(a, "status"),
			strVal(a, "runtime_mode"),
			archived,
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runAgentGet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var agent map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/get", map[string]any{"agent_id": args[0]}, &agent); err != nil {
		return fmt.Errorf("get agent: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, agent)
	}

	headers := []string{"ID", "NAME", "STATUS", "RUNTIME", "VISIBILITY", "DESCRIPTION"}
	rows := [][]string{{
		strVal(agent, "id"),
		strVal(agent, "name"),
		strVal(agent, "status"),
		strVal(agent, "runtime_mode"),
		strVal(agent, "visibility"),
		strVal(agent, "description"),
	}}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runAgentCreate(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	name, _ := cmd.Flags().GetString("name")
	if name == "" {
		return fmt.Errorf("--name is required")
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{
		"name": name,
	}
	if v, _ := cmd.Flags().GetString("description"); v != "" {
		body["description"] = v
	}
	if v, _ := cmd.Flags().GetString("instructions"); v != "" {
		body["instructions"] = v
	}
	if v, _ := cmd.Flags().GetString("runtime-id"); v != "" {
		body["runtime_id"] = v
	}
	if cmd.Flags().Changed("visibility") {
		v, _ := cmd.Flags().GetString("visibility")
		body["visibility"] = v
	}
	if cmd.Flags().Changed("max-concurrent-tasks") {
		v, _ := cmd.Flags().GetInt32("max-concurrent-tasks")
		body["max_concurrent_tasks"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/create", body, &result); err != nil {
		return fmt.Errorf("create agent: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Agent created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runAgentUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"agent_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}
	if cmd.Flags().Changed("instructions") {
		v, _ := cmd.Flags().GetString("instructions")
		body["instructions"] = v
	}
	if cmd.Flags().Changed("runtime-id") {
		v, _ := cmd.Flags().GetString("runtime-id")
		body["runtime_id"] = v
	}
	if cmd.Flags().Changed("visibility") {
		v, _ := cmd.Flags().GetString("visibility")
		body["visibility"] = v
	}
	if cmd.Flags().Changed("status") {
		v, _ := cmd.Flags().GetString("status")
		body["status"] = v
	}
	if cmd.Flags().Changed("max-concurrent-tasks") {
		v, _ := cmd.Flags().GetInt32("max-concurrent-tasks")
		body["max_concurrent_tasks"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/update", body, &result); err != nil {
		return fmt.Errorf("update agent: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Agent updated: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runAgentArchive(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/archive", map[string]any{"agent_id": args[0]}, &result); err != nil {
		return fmt.Errorf("archive agent: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Agent archived: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runAgentRestore(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/restore", map[string]any{"agent_id": args[0]}, &result); err != nil {
		return fmt.Errorf("restore agent: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Agent restored: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runAgentTasks(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var tasks map[string]any
	if err := client.postJSON(ctx, "/rpc/task/list", map[string]any{"agent_id": args[0]}, &tasks); err != nil {
		return fmt.Errorf("list agent tasks: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, tasks)
	}

	tasksRaw, _ := tasks["tasks"].([]any)
	headers := []string{"ID", "ISSUE_ID", "STATUS", "CREATED_AT"}
	rows := make([][]string, 0, len(tasksRaw))
	for _, raw := range tasksRaw {
		t, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			strVal(t, "id"),
			strVal(t, "issue_id"),
			strVal(t, "status"),
			strVal(t, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runAgentSkillsList(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var skills map[string]any
	if err := client.postJSON(ctx, "/rpc/skill/list", map[string]any{"agent_id": args[0]}, &skills); err != nil {
		return fmt.Errorf("list agent skills: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, skills)
	}

	skillsRaw, _ := skills["skills"].([]any)
	headers := []string{"ID", "NAME", "DESCRIPTION"}
	rows := make([][]string, 0, len(skillsRaw))
	for _, raw := range skillsRaw {
		s, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			strVal(s, "id"),
			strVal(s, "name"),
			strVal(s, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runAgentSkillsSet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	if !cmd.Flags().Changed("skill-ids") {
		return fmt.Errorf("--skill-ids is required (comma-separated skill IDs; use --skill-ids '' to clear all)")
	}
	skillIDs, _ := cmd.Flags().GetStringSlice("skill-ids")
	cleanIDs := make([]string, 0, len(skillIDs))
	for _, id := range skillIDs {
		id = strings.TrimSpace(id)
		if id != "" {
			cleanIDs = append(cleanIDs, id)
		}
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/agent/update", map[string]any{
		"agent_id":  args[0],
		"skill_ids": cleanIDs,
	}, &result); err != nil {
		return fmt.Errorf("set agent skills: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Skills updated for agent %s\n", args[0])
	return nil
}
