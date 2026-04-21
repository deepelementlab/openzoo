package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var updateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update the CLI to the latest version",
	RunE:  runUpdate,
}

func runUpdate(_ *cobra.Command, _ []string) error {
	v := version
	if v == "" {
		v = "dev"
	}
	fmt.Fprintf(os.Stderr, "Current version: %s\n", v)

	latest, err := fetchLatestRelease()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not check latest version: %v\n", err)
		return nil
	}

	latestVer := strings.TrimPrefix(latest.TagName, "v")
	currentVer := strings.TrimPrefix(v, "v")
	if currentVer == latestVer {
		fmt.Fprintln(os.Stderr, "Already up to date.")
		return nil
	}

	fmt.Fprintf(os.Stderr, "Latest version: %s\n", latest.TagName)
	fmt.Fprintf(os.Stderr, "Download from: https://github.com/openzoo-ai/openzoo/releases/latest\n")
	return nil
}

type githubRelease struct {
	TagName string `json:"tag_name"`
	HTMLURL string `json:"html_url"`
}

func fetchLatestRelease() (*githubRelease, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://api.github.com/repos/openzoo-ai/openzoo/releases/latest", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "openzoo-cli/"+runtime.GOOS+"/"+runtime.GOARCH)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}
	return &release, nil
}
