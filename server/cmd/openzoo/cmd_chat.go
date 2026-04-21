package main

import (
	"fmt"
	"os"
	"time"

	"github.com/spf13/cobra"
)

var chatCmd = &cobra.Command{
	Use:   "chat",
	Short: "Work with chat sessions",
}

var chatListCmd = &cobra.Command{
	Use:   "list",
	Short: "List chat sessions",
	RunE:  runChatList,
}

var chatCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new chat session",
	RunE:  runChatCreate,
}

var chatSendCmd = &cobra.Command{
	Use:   "send <session-id>",
	Short: "Send a message to a chat session",
	Args:  exactArgs(1),
	RunE:  runChatSend,
}

var chatMessagesCmd = &cobra.Command{
	Use:   "messages <session-id>",
	Short: "List messages in a chat session",
	Args:  exactArgs(1),
	RunE:  runChatMessages,
}

func init() {
	chatCmd.AddCommand(chatListCmd)
	chatCmd.AddCommand(chatCreateCmd)
	chatCmd.AddCommand(chatSendCmd)
	chatCmd.AddCommand(chatMessagesCmd)

	chatListCmd.Flags().String("output", "table", "Output format: table or json")

	chatCreateCmd.Flags().String("title", "", "Chat session title")
	chatCreateCmd.Flags().String("agent-id", "", "Agent ID to chat with")
	chatCreateCmd.Flags().String("output", "json", "Output format: table or json")

	chatSendCmd.Flags().String("content", "", "Message content (required)")
	chatSendCmd.Flags().String("output", "json", "Output format: table or json")

	chatMessagesCmd.Flags().String("output", "table", "Output format: table or json")
	chatMessagesCmd.Flags().Int("limit", 50, "Maximum number of messages to return")
}

func runChatList(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/chat/sessions", map[string]any{}, &result); err != nil {
		return fmt.Errorf("list chat sessions: %w", err)
	}

	sessionsRaw, _ := result["sessions"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, sessionsRaw)
	}

	headers := []string{"ID", "TITLE", "AGENT", "CREATED"}
	rows := make([][]string, 0, len(sessionsRaw))
	for _, raw := range sessionsRaw {
		s, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		rows = append(rows, []string{
			truncateID(strVal(s, "id")),
			strVal(s, "title"),
			truncateID(strVal(s, "agent_id")),
			strVal(s, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}

func runChatCreate(cmd *cobra.Command, _ []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{}
	if v, _ := cmd.Flags().GetString("title"); v != "" {
		body["title"] = v
	}
	if v, _ := cmd.Flags().GetString("agent-id"); v != "" {
		body["agent_id"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/chat/create-session", body, &result); err != nil {
		return fmt.Errorf("create chat session: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Chat session created: %s (%s)\n", strVal(result, "title"), strVal(result, "id"))
	return nil
}

func runChatSend(cmd *cobra.Command, args []string) error {
	content, _ := cmd.Flags().GetString("content")
	if content == "" {
		return fmt.Errorf("--content is required")
	}

	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(60 * time.Second)
	defer cancel()

	body := map[string]any{
		"session_id": args[0],
		"content":    content,
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/chat/send", body, &result); err != nil {
		return fmt.Errorf("send message: %w", err)
	}

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, result)
	}

	fmt.Fprintf(os.Stderr, "Message sent to session %s.\n", truncateID(args[0]))
	return nil
}

func runChatMessages(cmd *cobra.Command, args []string) error {
	client, err := newAPIClient(cmd)
	if err != nil {
		return err
	}

	ctx, cancel := contextWithTimeout(15 * time.Second)
	defer cancel()

	body := map[string]any{"session_id": args[0]}
	if v, _ := cmd.Flags().GetInt("limit"); v > 0 {
		body["limit"] = v
	}

	var result map[string]any
	if err := client.postJSON(ctx, "/rpc/chat/messages", body, &result); err != nil {
		return fmt.Errorf("list messages: %w", err)
	}

	messagesRaw, _ := result["messages"].([]any)

	output, _ := cmd.Flags().GetString("output")
	if output == "json" {
		return printJSON(os.Stdout, messagesRaw)
	}

	headers := []string{"ID", "ROLE", "CONTENT", "CREATED"}
	rows := make([][]string, 0, len(messagesRaw))
	for _, raw := range messagesRaw {
		m, ok := raw.(map[string]any)
		if !ok {
			continue
		}
		content := strVal(m, "content")
		if len(content) > 80 {
			content = content[:77] + "..."
		}
		rows = append(rows, []string{
			truncateID(strVal(m, "id")),
			strVal(m, "role"),
			content,
			strVal(m, "created_at"),
		})
	}
	printTable(os.Stdout, headers, rows)
	return nil
}
