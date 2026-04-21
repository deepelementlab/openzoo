package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var inboxCmd = &cobra.Command{
	Use:   "inbox",
	Short: "Work with inbox notifications",
}

var inboxListCmd = &cobra.Command{
	Use:   "list",
	Short: "List inbox notifications",
	RunE:  runInboxList,
}

var inboxMarkReadCmd = &cobra.Command{
	Use:   "mark-read <id>",
	Short: "Mark a notification as read",
	Args:  exactArgs(1),
	RunE:  runInboxMarkRead,
}

var inboxMarkAllReadCmd = &cobra.Command{
	Use:   "mark-all-read",
	Short: "Mark all notifications as read",
	RunE:  runInboxMarkAllRead,
}

var inboxMarkArchivedCmd = &cobra.Command{
	Use:   "mark-archived <id>",
	Short: "Mark a notification as archived",
	Args:  exactArgs(1),
	RunE:  runInboxMarkArchived,
}

func init() {
	inboxCmd.AddCommand(inboxListCmd)
	inboxCmd.AddCommand(inboxMarkReadCmd)
	inboxCmd.AddCommand(inboxMarkAllReadCmd)
	inboxCmd.AddCommand(inboxMarkArchivedCmd)

	inboxListCmd.Flags().String("output", "table", "Output format: table or json")
	inboxListCmd.Flags().Bool("unreadOnly", false, "Show only unread notifications")

	inboxMarkReadCmd.Flags().String("output", "json", "Output format: table or json")
	inboxMarkAllReadCmd.Flags().String("output", "json", "Output format: table or json")
	inboxMarkArchivedCmd.Flags().String("output", "json", "Output format: table or json")
}

func runInboxList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{}
	if v, _ := cmd.Flags().GetBool("unreadOnly"); v {
		body["unread_only"] = true
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/inbox/list", body, &result); err != nil {
		return fmt.Errorf("list inbox: %w", err)
	}

	notificationsRaw, _ := result["notifications"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, notificationsRaw)
	}

	headers := []string{"ID", "TYPE", "MESSAGE", "READ", "CREATED"}
	rows := make([][]string, 0, len(notificationsRaw))
	for _, raw := range notificationsRaw {
		n, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		read := ""
		if r, _ := n["is_read"].(bool); r {
			read = "yes"
		}
		rows = append(rows, []string{
			truncateID(strVal(n, "id")),
			strVal(n, "type"),
			truncateID(strVal(n, "message")),
			read,
			strVal(n, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runInboxMarkRead(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/inbox/mark-read", map[string]any{"notification_id": args[0]}, nil); err != nil {
		return fmt.Errorf("mark read: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Notification %s marked as read.\n", truncateID(args[0]))
	return nil
}

func runInboxMarkAllRead(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/inbox/mark-all-read", nil, nil); err != nil {
		return fmt.Errorf("mark all read: %w", err)
	}

	fmt.Fprintf(os.Stderr, "All notifications marked as read.\n")
	return nil
}

func runInboxMarkArchived(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	if err := client.postJSON(ctx, "/rpc/inbox/mark-archived", map[string]any{"notification_id": args[0]}, nil); err != nil {
		return fmt.Errorf("mark archived: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Notification %s marked as archived.\n", truncateID(args[0]))
	return nil
}
