package main

import (
	"os"

	"github.com/spf13/cobra"
)

func registerCommands(root *cobra.Command) {
	root.PersistentFlags().String("server-url", getenv("OPENZOO_SERVER_URL", "http://localhost:8080"), "OpenZoo server URL")
	root.PersistentFlags().String("workspace-id", getenv("OPENZOO_WORKSPACE_ID", ""), "Workspace ID")
	root.PersistentFlags().String("token", getenv("OPENZOO_TOKEN", ""), "Auth token")
	root.PersistentFlags().String("profile", "", "Configuration profile to use")

	root.AddCommand(authCmd)
	root.AddCommand(workspaceCmd)
	root.AddCommand(issueCmd)
	root.AddCommand(agentCmd)
	root.AddCommand(runtimeCmd)
	root.AddCommand(patCmd)
	root.AddCommand(skillCmd)
	root.AddCommand(projectCmd)
	root.AddCommand(daemonCmd)
	root.AddCommand(labelCmd)
	root.AddCommand(cycleCmd)
	root.AddCommand(viewCmd)
	root.AddCommand(chatCmd)
	root.AddCommand(taskCmd)
	root.AddCommand(inboxCmd)
	root.AddCommand(configCmd)
	root.AddCommand(versionCmd)
	root.AddCommand(updateCmd)
	root.AddCommand(loginCmd)
	root.AddCommand(setupCmd)
	root.AddCommand(attachmentCmd)
	root.AddCommand(repoCmd)

	initHelp(root)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
