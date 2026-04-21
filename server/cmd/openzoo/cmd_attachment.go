package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

var attachmentCmd = &cobra.Command{
	Use:   "attachment",
	Short: "Work with file attachments",
}

var attachmentDownloadCmd = &cobra.Command{
	Use:   "download <attachment-id>",
	Short: "Download an attachment to a local file",
	Args:  exactArgs(1),
	RunE:  runAttachmentDownload,
}

func init() {
	attachmentDownloadCmd.Flags().StringP("output-dir", "o", ".", "Directory to save the downloaded file")
	attachmentCmd.AddCommand(attachmentDownloadCmd)
}

func runAttachmentDownload(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	wsID, err := requireWorkspaceID(cmd)
	if err != nil {
		return err
	}

	var att struct {
		ID          string `json:"id"`
		Filename    string `json:"filename"`
		DownloadURL string `json:"download_url"`
	}
	if err := client.postJSON(ctx, "/rpc/file/get", map[string]any{
		"workspace_id": wsID,
		"file_id":      args[0],
	}, &att); err != nil {
		return fmt.Errorf("get attachment: %w", err)
	}

	downloadURL := att.DownloadURL
	if downloadURL == "" {
		downloadURL = client.serverURL + "/rpc/file/download/" + args[0] + "?workspace_id=" + wsID
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, nil)
	if err != nil {
		return err
	}
	if client.token != "" {
		req.Header.Set("Authorization", "Bearer "+client.token)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed: %s", resp.Status)
	}

	filename := att.Filename
	if filename == "" {
		filename = args[0]
	}
	filename = sanitizeFilename(filename)

	outputDir, _ := cmd.Flags().GetString("output-dir")
	destPath := filepath.Join(outputDir, filename)

	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, resp.Body); err != nil {
		return fmt.Errorf("write file: %w", err)
	}

	abs, _ := filepath.Abs(destPath)
	fmt.Fprintln(os.Stdout, abs)
	fmt.Fprintf(os.Stderr, "Downloaded: %s\n", abs)
	return nil
}

func sanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, "..", "")
	name = strings.ReplaceAll(name, "/", "")
	name = strings.ReplaceAll(name, "\\", "")
	name = strings.ReplaceAll(name, "\x00", "")
	return strings.TrimSpace(name)
}
