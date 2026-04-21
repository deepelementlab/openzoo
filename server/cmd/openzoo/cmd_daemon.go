package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/openzoo-ai/openzoo/server/internal/daemon"
	"github.com/spf13/cobra"
)

var daemonCmd = &cobra.Command{
	Use:   "daemon",
	Short: "Manage daemon workers",
}

var daemonListCmd = &cobra.Command{
	Use:   "list",
	Short: "List daemon workers",
	RunE:  runDaemonList,
}

var daemonGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get daemon details",
	Args:  exactArgs(1),
	RunE:  runDaemonGet,
}

var daemonStatsCmd = &cobra.Command{
	Use:   "stats <id>",
	Short: "Get daemon statistics",
	Args:  exactArgs(1),
	RunE:  runDaemonStats,
}

var daemonStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start the daemon worker process",
	RunE:  runDaemonStart,
}

var daemonStopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop the daemon worker process",
	RunE:  runDaemonStop,
}

var daemonStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show daemon worker status",
	RunE:  runDaemonStatus,
}

func init() {
	daemonCmd.AddCommand(daemonListCmd)
	daemonCmd.AddCommand(daemonGetCmd)
	daemonCmd.AddCommand(daemonStatsCmd)
	daemonCmd.AddCommand(daemonStartCmd)
	daemonCmd.AddCommand(daemonStopCmd)
	daemonCmd.AddCommand(daemonStatusCmd)

	daemonListCmd.Flags().String("output", "table", "Output format: table or json")
	daemonGetCmd.Flags().String("output", "json", "Output format: table or json")
	daemonStatsCmd.Flags().String("output", "table", "Output format: table or json")
	daemonStartCmd.Flags().String("server", "", "Server URL (default: from config)")
	daemonStartCmd.Flags().StringSlice("workspace", nil, "Workspace IDs to monitor")
	daemonStartCmd.Flags().Int("max-concurrent", 5, "Maximum concurrent tasks")
	daemonStartCmd.Flags().String("workdir", "", "Working directory for task execution")
	daemonStartCmd.Flags().String("agents", "", "JSON string of agent configs: {\"claude\":{\"path\":\"claude\",\"model\":\"sonnet\"}}")
}

func runDaemonList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}
	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/daemon/list", map[string]any{}, &result); err != nil {
		return fmt.Errorf("list daemons: %w", err)
	}

	daemonsRaw, _ := result["daemons"].([]any)
	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, daemonsRaw)
	}

	headers := []string{"ID", "RUNTIME_ID", "STATUS", "LAST_SEEN"}
	rows := make([][]string, 0, len(daemonsRaw))
	for _, raw := range daemonsRaw {
		d, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(d, "id")),
			truncateID(strVal(d, "runtime_id")),
			strVal(d, "status"),
			strVal(d, "last_heartbeat_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runDaemonGet(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}
	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/daemon/get", map[string]any{"daemon_id": args[0]}, &result); err != nil {
		return fmt.Errorf("get daemon: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	headers := []string{"ID", "RUNTIME_ID", "STATUS", "LAST_SEEN"}
	rows := [][]string{{
		strVal(result, "id"),
		strVal(result, "runtime_id"),
		strVal(result, "status"),
		strVal(result, "last_heartbeat_at"),
	}}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runDaemonStats(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}
	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/daemon/stats", map[string]any{"daemon_id": args[0]}, &result); err != nil {
		return fmt.Errorf("get daemon stats: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stdout, "Daemon ID: %s\n", strVal(result, "daemon_id"))
	if totalTasks, ok := result["total_tasks"].(float64); ok {
		fmt.Fprintf(os.Stdout, "Total Tasks: %.0f\n", totalTasks)
	}
	if activeTasks, ok := result["active_tasks"].(float64); ok {
		fmt.Fprintf(os.Stdout, "Active Tasks: %.0f\n", activeTasks)
	}
	fmt.Fprintf(os.Stdout, "Status: %s\n", strVal(result, "status"))
	return nil
}

func runDaemonStart(cmd *cobra.Command, _ []string) error {
	cfg := daemon.DefaultConfig()

	profile := resolveProfile(cmd)
	cliCfg, _ := loadCLIConfigForProfile(profile)
	if cliCfg.Token == "" {
		return fmt.Errorf("no authenticated profile found, run 'openzoo auth login' first")
	}
	cfg.Token = cliCfg.Token
	if server, _ := cmd.Flags().GetString("server"); server != "" {
		cfg.ServerURL = server
	} else if cliCfg.ServerURL != "" {
		cfg.ServerURL = cliCfg.ServerURL
	}
	if workspaces, _ := cmd.Flags().GetStringSlice("workspace"); len(workspaces) > 0 {
		cfg.WorkspaceIDs = workspaces
	} else if cliCfg.WorkspaceID != "" {
		cfg.WorkspaceIDs = []string{cliCfg.WorkspaceID}
	}
	if maxConc, _ := cmd.Flags().GetInt("max-concurrent"); maxConc > 0 {
		cfg.MaxConcurrentTasks = maxConc
	}
	if workdir, _ := cmd.Flags().GetString("workdir"); workdir != "" {
		cfg.WorkDir = workdir
	}
	if agentsJSON, _ := cmd.Flags().GetString("agents"); agentsJSON != "" {
		if err := json.Unmarshal([]byte(agentsJSON), &cfg.Agents); err != nil {
			return fmt.Errorf("invalid agents JSON: %w", err)
		}
	} else {
		cfg.Agents = map[string]daemon.AgentEntry{
			"claude": {Path: "claude", Model: "sonnet"},
		}
	}

	d := daemon.NewDaemon(cfg)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	fmt.Fprintf(os.Stderr, "Starting OpenZoo daemon...\n")
	fmt.Fprintf(os.Stderr, "  Server: %s\n", cfg.ServerURL)
	fmt.Fprintf(os.Stderr, "  Workspaces: %v\n", cfg.WorkspaceIDs)
	fmt.Fprintf(os.Stderr, "  Agents: %v\n", func() []string {
		var names []string
		for k := range cfg.Agents {
			names = append(names, k)
		}
		return names
	}())

	return d.Run(ctx)
}

func runDaemonStop(cmd *cobra.Command, _ []string) error {
	pidFile := os.TempDir() + "/openzoo-daemon.pid"
	data, err := os.ReadFile(pidFile)
	if err != nil {
		return fmt.Errorf("no running daemon found (pid file not found)")
	}
	fmt.Fprintf(os.Stdout, "Daemon process (PID %s) should be stopped via signal.\n", string(data))
	return nil
}

func runDaemonStatus(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}
	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/daemon/list", map[string]any{}, &result); err != nil {
		return fmt.Errorf("failed to reach server: %w", err)
	}

	daemons, _ := result["daemons"].([]any)
	fmt.Fprintf(os.Stdout, "Connected daemons: %d\n", len(daemons))
	for i, raw := range daemons {
		d, _ := raw.(map[string]any)
		fmt.Fprintf(os.Stdout, "  [%d] %s status=%s\n", i+1, truncateID(strVal(d, "id")), strVal(d, "status"))
	}
	return nil
}
