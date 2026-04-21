package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

type cliConfig struct {
	Token             string   `json:"token"`
	ServerURL         string   `json:"server_url"`
	AppURL            string   `json:"app_url"`
	WorkspaceID       string   `json:"workspace_id"`
	WatchedWorkspaces []string `json:"watched_workspaces"`
}

func configDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	dir := filepath.Join(home, ".config", "openzoo")
	return dir, os.MkdirAll(dir, 0755)
}

func configPath(profile string) string {
	if profile == "" {
		profile = "default"
	}
	dir, _ := configDir()
	return filepath.Join(dir, profile+".json")
}

func loadCLIConfigForProfile(profile string) (*cliConfig, error) {
	path := configPath(profile)
	data, err := os.ReadFile(path)
	if err != nil {
		return &cliConfig{}, nil
	}
	var cfg cliConfig
	json.Unmarshal(data, &cfg)
	return &cfg, nil
}

func saveCLIConfigForProfile(cfg *cliConfig, profile string) error {
	path := configPath(profile)
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

type apiClient struct {
	serverURL   string
	workspaceID string
	token       string
}

func newAPIClient(cmd *cobra.Command) (*apiClient, error) {
	serverURL := resolveServerURL(cmd)
	workspaceID := resolveWorkspaceID(cmd)
	token := resolveToken(cmd)

	if serverURL == "" {
		return nil, fmt.Errorf("server URL not set: use --server-url flag, OPENZOO_SERVER_URL env, or 'openzoo config set server_url <url>'")
	}

	return &apiClient{
		serverURL:   serverURL,
		workspaceID: workspaceID,
		token:       token,
	}, nil
}

func newAPIClientWithAuth(serverURL, workspaceID, token string) *apiClient {
	return &apiClient{
		serverURL:   serverURL,
		workspaceID: workspaceID,
		token:       token,
	}
}

func (c *apiClient) postJSON(ctx context.Context, path string, payload any, result any) error {
	var body []byte
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = b
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.serverURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	if c.workspaceID != "" {
		req.Header.Set("X-Workspace-Id", c.workspaceID)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 300 {
		return fmt.Errorf("request failed: %s %s", resp.Status, strings.TrimSpace(string(respBody)))
	}

	if result != nil {
		return json.Unmarshal(respBody, result)
	}
	return nil
}

func resolveServerURL(cmd *cobra.Command) string {
	val := flagOrEnv(cmd, "server-url", "OPENZOO_SERVER_URL", "")
	if val != "" {
		return strings.TrimRight(val, "/")
	}
	profile := resolveProfile(cmd)
	cfg, err := loadCLIConfigForProfile(profile)
	if err == nil && cfg.ServerURL != "" {
		return strings.TrimRight(cfg.ServerURL, "/")
	}
	return "http://localhost:8080"
}

func resolveWorkspaceID(cmd *cobra.Command) string {
	val := flagOrEnv(cmd, "workspace-id", "OPENZOO_WORKSPACE_ID", "")
	if val != "" {
		return val
	}
	profile := resolveProfile(cmd)
	cfg, _ := loadCLIConfigForProfile(profile)
	return cfg.WorkspaceID
}

func requireWorkspaceID(cmd *cobra.Command) (string, error) {
	id := resolveWorkspaceID(cmd)
	if id == "" {
		return "", fmt.Errorf("workspace_id is required: use --workspace-id flag, set OPENZOO_WORKSPACE_ID env, or run 'openzoo workspace use <id>'")
	}
	return id, nil
}

func flagOrEnv(cmd *cobra.Command, flag, env, fallback string) string {
	if cmd.Flags().Changed(flag) {
		v, _ := cmd.Flags().GetString(flag)
		return v
	}
	if v := os.Getenv(env); v != "" {
		return v
	}
	return fallback
}

func resolveProfile(cmd *cobra.Command) string {
	val, _ := cmd.Flags().GetString("profile")
	return val
}

func strVal(m map[string]any, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func truncateID(id string) string {
	if len(id) > 8 {
		return id[:8]
	}
	return id
}

func contextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}

func exactArgs(n int) cobra.PositionalArgs {
	return func(cmd *cobra.Command, args []string) error {
		if len(args) != n {
			return fmt.Errorf("requires %d arg(s), received %d", n, len(args))
		}
		return nil
	}
}
