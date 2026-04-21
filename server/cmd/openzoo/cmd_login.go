package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Authenticate and set up workspaces",
	Long:  "Log in to OpenZoo, then automatically discover and configure all your workspaces.",
	RunE:  runLogin,
}

func init() {
	loginCmd.Flags().Bool("token", false, "Authenticate by pasting a personal access token")
}

func runLogin(cmd *cobra.Command, _ []string) error {
	useToken, _ := cmd.Flags().GetBool("token")
	serverURL := resolveServerURL(cmd)

	if useToken {
		fmt.Fprint(os.Stderr, "Enter personal access token: ")
		var token string
		fmt.Fscanln(os.Stdin, &token)
		if token == "" {
			return fmt.Errorf("token is required")
		}
		profile := resolveProfile(cmd)
		cfg, err := loadCLIConfigForProfile(profile)
		if err != nil {
			return err
		}
		cfg.Token = strings.TrimSpace(token)
		cfg.ServerURL = serverURL
		if err := saveCLIConfigForProfile(cfg, profile); err != nil {
			return err
		}
		fmt.Fprintln(os.Stderr, "Token saved.")
		return autoWatchWorkspaces(cmd)
	}

	fmt.Fprintln(os.Stderr, "Opening browser for authentication...")
	fmt.Fprintln(os.Stderr, "If the browser doesn't open, visit:")
	fmt.Fprintf(os.Stderr, "  %s/auth/login\n", serverURL)

	fmt.Fprint(os.Stderr, "\nEnter verification code: ")
	_ = serverURL
	return nil
}

func autoWatchWorkspaces(cmd *cobra.Command) error {
	serverURL := resolveServerURL(cmd)
	profile := resolveProfile(cmd)
	cfg, err := loadCLIConfigForProfile(profile)
	if err != nil {
		return err
	}
	if cfg.Token == "" {
		return fmt.Errorf("not authenticated")
	}

	client := newAPIClientWithAuth(serverURL, "", cfg.Token)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var result struct {
		Workspaces []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"workspaces"`
	}
	if err := client.postJSON(ctx, "/rpc/workspace/list", map[string]any{"limit": 100}, &result); err != nil {
		return fmt.Errorf("list workspaces: %w", err)
	}

	if len(result.Workspaces) == 0 {
		fmt.Fprintln(os.Stderr, "\nNo workspaces found.")
		return nil
	}

	if cfg.WorkspaceID == "" {
		cfg.WorkspaceID = result.Workspaces[0].ID
	}

	if err := saveCLIConfigForProfile(cfg, profile); err != nil {
		return err
	}

	fmt.Fprintf(os.Stderr, "\nDiscovered %d workspace(s):\n", len(result.Workspaces))
	for _, ws := range result.Workspaces {
		fmt.Fprintf(os.Stderr, "  - %s (%s)\n", ws.Name, ws.ID)
	}
	if cfg.WorkspaceID != "" {
		fmt.Fprintf(os.Stderr, "\nDefault workspace: %s\n", cfg.WorkspaceID)
	}
	return nil
}
