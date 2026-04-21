package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var patCmd = &cobra.Command{
	Use:   "pat",
	Short: "Manage personal access tokens",
}

var patListCmd = &cobra.Command{
	Use:   "list",
	Short: "List personal access tokens",
	RunE:  runPATList,
}

var patCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new personal access token",
	RunE:  runPATCreate,
}

var patDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a personal access token",
	Args:  exactArgs(1),
	RunE:  runPATDelete,
}

func init() {
	patCmd.AddCommand(patListCmd)
	patCmd.AddCommand(patCreateCmd)
	patCmd.AddCommand(patDeleteCmd)

	patListCmd.Flags().String("output", "table", "Output format: table or json")

	patCreateCmd.Flags().String("name", "", "Token name (required)")
	patCreateCmd.Flags().Int("expires-in-days", 90, "Number of days until token expires")
	patCreateCmd.Flags().String("output", "json", "Output format: table or json")

	patDeleteCmd.Flags().String("output", "json", "Output format: table or json")
}

func runPATList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/pat/list", nil, &result); err != nil {
		return fmt.Errorf("list tokens: %w", err)
	}

	tokensRaw, _ := result["tokens"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, tokensRaw)
	}

	headers := []string{"ID", "NAME", "CREATED", "EXPIRES"}
	rows := make([][]string, 0, len(tokensRaw))
	for _, raw := range tokensRaw {
		t, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(t, "id")),
			strVal(t, "name"),
			strVal(t, "created_at"),
			strVal(t, "expires_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runPATCreate(cmd *cobra.Command, _ []string) error {
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
	if v, _ := cmd.Flags().GetInt("expires-in-days"); v > 0 {
		body["expires_in_days"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/pat/create", body, &result); err != nil {
		return fmt.Errorf("create token: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	token := strVal(result, "token")
	fmt.Fprintf(os.Stderr, "Token created: %s\n", strVal(result, "name"))
	fmt.Fprintf(os.Stderr, "Token value: %s\n", token)
	return nil
}

func runPATDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/pat/delete", map[string]any{"token_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete token: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Token %s deleted.\n", truncateID(args[0]))
	return nil
}
