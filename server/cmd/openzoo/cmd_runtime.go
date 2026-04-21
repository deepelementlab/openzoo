package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var runtimeCmd = &cobra.Command{
	Use:   "runtime",
	Short: "Work with agent runtimes",
}

var runtimeListCmd = &cobra.Command{
	Use:   "list",
	Short: "List runtimes in the workspace",
	RunE:  runRuntimeList,
}

var runtimeGetCmd = &cobra.Command{
	Use:   "get <runtime-id>",
	Short: "Get runtime details",
	Args:  exactArgs(1),
	RunE:  runRuntimeGet,
}

var runtimePingCmd = &cobra.Command{
	Use:   "ping <runtime-id>",
	Short: "Ping a runtime to check connectivity",
	Args:  exactArgs(1),
	RunE:  runRuntimePing,
}

var runtimeUpdateCmd = &cobra.Command{
	Use:   "update <runtime-id>",
	Short: "Update a runtime",
	Args:  exactArgs(1),
	RunE:  runRuntimeUpdate,
}

var runtimeDeleteCmd = &cobra.Command{
	Use:   "delete <runtime-id>",
	Short: "Delete a runtime",
	Args:  exactArgs(1),
	RunE:  runRuntimeDelete,
}

func init() {
	runtimeCmd.AddCommand(runtimeListCmd)
	runtimeCmd.AddCommand(runtimeGetCmd)
	runtimeCmd.AddCommand(runtimePingCmd)
	runtimeCmd.AddCommand(runtimeUpdateCmd)
	runtimeCmd.AddCommand(runtimeDeleteCmd)

	runtimeListCmd.Flags().String("output", "table", "Output format: table or json")

	runtimeGetCmd.Flags().String("output", "json", "Output format: table or json")

	runtimePingCmd.Flags().String("output", "json", "Output format: table or json")

	runtimeUpdateCmd.Flags().String("name", "", "New runtime name")
	runtimeUpdateCmd.Flags().String("status", "", "New runtime status")
	runtimeUpdateCmd.Flags().String("output", "json", "Output format: table or json")

	runtimeDeleteCmd.Flags().String("output", "json", "Output format: table or json")
}

func runRuntimeList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/runtime/list", map[string]any{}, &result); err != nil {
		return fmt.Errorf("list runtimes: %w", err)
	}

	runtimesRaw, _ := result["runtimes"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, runtimesRaw)
	}

	headers := []string{"ID", "NAME", "MODE", "PROVIDER", "STATUS", "LAST_SEEN"}
	rows := make([][]string, 0, len(runtimesRaw))
	for _, raw := range runtimesRaw {
		rt, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			strVal(rt, "id"),
			strVal(rt, "name"),
			strVal(rt, "runtime_mode"),
			strVal(rt, "provider"),
			strVal(rt, "status"),
			strVal(rt, "last_seen_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runRuntimeGet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var runtime map[string]any
	if err := client.postJSON(ctx, "/rpc/runtime/get", map[string]any{"runtime_id": args[0]}, &runtime); err != nil {
		return fmt.Errorf("get runtime: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, runtime)
	}

	headers := []string{"ID", "NAME", "MODE", "PROVIDER", "STATUS", "DESCRIPTION"}
	rows := [][]string{{
		strVal(runtime, "id"),
		strVal(runtime, "name"),
		strVal(runtime, "runtime_mode"),
		strVal(runtime, "provider"),
		strVal(runtime, "status"),
		strVal(runtime, "description"),
	}}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runRuntimePing(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(90 * time.Second)
	defer cancel()

	var ping map[string]any
	if err := client.postJSON(ctx, "/rpc/runtime/ping", map[string]any{"runtime_id": args[0]}, &ping); err != nil {
		return fmt.Errorf("ping runtime: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, ping)
	}

	fmt.Fprintf(os.Stderr, "Ping result: %s (status: %s)\n", strVal(ping, "id"), strVal(ping, "status"))
	return nil
}

func runRuntimeUpdate(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	body := map[string]any{"runtime_id": args[0]}
	if cmd.Flags().Changed("name") {
		v, _ := cmd.Flags().GetString("name")
		body["name"] = v
	}
	if cmd.Flags().Changed("status") {
		v, _ := cmd.Flags().GetString("status")
		body["status"] = v
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/runtime/update", body, &result); err != nil {
		return fmt.Errorf("update runtime: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Runtime updated: %s (%s)\n", strVal(result, "name"), strVal(result, "id"))
	return nil
}

func runRuntimeDelete(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/runtime/delete", map[string]any{"runtime_id": args[0]}, nil); err != nil {
		return fmt.Errorf("delete runtime: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Runtime %s deleted.\n", truncateID(args[0]))
	return nil
}
