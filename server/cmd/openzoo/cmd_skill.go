package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var skillCmd = &cobra.Command{
	Use:   "skill",
	Short: "Work with skills",
}

var skillListCmd = &cobra.Command{
	Use:   "list",
	Short: "List skills",
	RunE:  runSkillList,
}

var skillCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new skill",
	RunE:  runSkillCreate,
}

var skillUpdateCmd = &cobra.Command{
	Use:   "update <id>",
	Short: "Update a skill",
	Args:  exactArgs(1),
	RunE:  runSkillUpdate,
}

var skillDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a skill",
	Args:  exactArgs(1),
	RunE:  runSkillDelete,
}

func init() {
	skillCmd.AddCommand(skillListCmd)
	skillCmd.AddCommand(skillCreateCmd)
	skillCmd.AddCommand(skillUpdateCmd)
	skillCmd.AddCommand(skillDeleteCmd)

	skillListCmd.Flags().String("output", "table", "Output format: table or json")
	skillListCmd.Flags().String("agent-id", "", "Filter by agent ID")

	skillCreateCmd.Flags().String("name", "", "Skill name (required)")
	skillCreateCmd.Flags().String("description", "", "Skill description")
	skillCreateCmd.Flags().String("content", "", "Skill content")
	skillCreateCmd.Flags().String("output", "json", "Output format: table or json")

	skillUpdateCmd.Flags().String("name", "", "New name")
	skillUpdateCmd.Flags().String("description", "", "New description")
	skillUpdateCmd.Flags().String("content", "", "New content")
	skillUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	skillDeleteCmd.Flags().String("output", "json", "Output format: table or json")
}

func runSkillList(cmd *cobra.Command, _ []string) error {
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

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/skill/list", body, &result); err != nil {
		return fmt.Errorf("list skills: %w", err)
	}

	skillsRaw, _ := result["skills"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, skillsRaw)
	}

	headers := []string{"ID", "NAME", "DESCRIPTION"}
	rows := make([][]string, 0, len(skillsRaw))
	for _, raw := range skillsRaw {
		s, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(s, "id")),
			strVal(s, "name"),
			strVal(s, "description"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runSkillCreate(cmd *cobra.Command, _ []string) error {
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
	if v, _ := cmd.Flags().GetString("content"); v != "" {
		body["content"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/skill/create", body, &result); err != nil {
		return fmt.Errorf("create skill: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Skill created: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runSkillUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"skill_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("description") {
		v, _ := cmd.Flags().GetString("description")
		body["description"] = v
	}
	if cmd.Flags().Changed("content") {
		v, _ := cmd.Flags().GetString("content")
		body["content"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/skill/update", body, &result); err != nil {
		return fmt.Errorf("update skill: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Skill updated: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runSkillDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/skill/delete", map[string]any{"skill_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete skill: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Skill %s deleted.\n", truncateID(args[0]))
	return nil
}
