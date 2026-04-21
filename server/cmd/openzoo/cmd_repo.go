package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var repoCmd = &cobra.Command{
	Use:   "repo",
	Short: "Work with repositories",
}

var repoCheckoutCmd = &cobra.Command{
	Use:   "checkout <url>",
	Short: "Check out a repository via the daemon",
	Args:  exactArgs(1),
	RunE:  runRepoCheckout,
}

func init() {
	repoCmd.AddCommand(repoCheckoutCmd)
}

func runRepoCheckout(_ *cobra.Command, args []string) error {
	repoURL := args[0]
	daemonPort := os.Getenv("OPENZOO_DAEMON_PORT")
	if daemonPort == "" {
		daemonPort = "19514"
	}

	workspaceID := os.Getenv("OPENZOO_WORKSPACE_ID")
	agentName := os.Getenv("OPENZOO_AGENT_NAME")
	taskID := os.Getenv("OPENZOO_TASK_ID")

	workDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("get working directory: %w", err)
	}

	reqBody := map[string]string{
		"url":          repoURL,
		"workspace_id": workspaceID,
		"workdir":      workDir,
		"agent_name":   agentName,
		"task_id":      taskID,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("encode request: %w", err)
	}

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Post(
		fmt.Sprintf("http://127.0.0.1:%s/repo/checkout", daemonPort),
		"application/json",
		bytes.NewReader(data),
	)
	if err != nil {
		return fmt.Errorf("connect to daemon: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("checkout failed: %s", string(body))
	}

	var result struct {
		Path       string `json:"path"`
		BranchName string `json:"branch_name"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("parse response: %w", err)
	}

	fmt.Fprintf(os.Stdout, "%s\n", result.Path)
	fmt.Fprintf(os.Stderr, "Checked out %s -> %s (branch: %s)\n", repoURL, result.Path, result.BranchName)
	return nil
}
