package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/spf13/cobra"
)

var setupCmd = &cobra.Command{
	Use:   "setup",
	Short: "One-command setup: configure, authenticate, and start the daemon",
	RunE:  runSetup,
}

func init() {
	setupCmd.Flags().Bool("local", false, "Force local mode (skip server auto-detection)")
	setupCmd.Flags().Int("port", 8080, "Backend server port (for local mode)")
	setupCmd.Flags().Int("frontend-port", 3000, "Frontend port (for local mode)")
}

func runSetup(cmd *cobra.Command, _ []string) error {
	forceLocal, _ := cmd.Flags().GetBool("local")
	port, _ := cmd.Flags().GetInt("port")
	frontendPort, _ := cmd.Flags().GetInt("frontend-port")
	profile := resolveProfile(cmd)

	isLocal := forceLocal
	if !forceLocal {
		isLocal = probeLocalServer(port)
	}

	if isLocal {
		fmt.Println("Detected local OpenZoo server.")
		cfg, _ := loadCLIConfigForProfile(profile)
		cfg.AppURL = fmt.Sprintf("http://localhost:%d", frontendPort)
		cfg.ServerURL = fmt.Sprintf("http://localhost:%d", port)
		if err := saveCLIConfigForProfile(cfg, profile); err != nil {
			return fmt.Errorf("save config: %w", err)
		}
		fmt.Printf("  app_url:    %s\n", cfg.AppURL)
		fmt.Printf("  server_url: %s\n", cfg.ServerURL)
	} else if !forceLocal {
		fmt.Println("No local server detected — configuring for OpenZoo Cloud.")
		cfg, _ := loadCLIConfigForProfile(profile)
		cfg.AppURL = "https://openzoo.ai"
		cfg.ServerURL = "https://api.openzoo.ai"
		if err := saveCLIConfigForProfile(cfg, profile); err != nil {
			return fmt.Errorf("save config: %w", err)
		}
	}

	fmt.Println("")
	if err := runLogin(cmd, nil); err != nil {
		return err
	}

	fmt.Println("\nSetup complete!")
	return nil
}

func probeLocalServer(port int) bool {
	url := fmt.Sprintf("http://localhost:%d/health", port)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false
	}
	resp, err := (&http.Client{Timeout: 2 * time.Second}).Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}
