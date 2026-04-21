package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:           "openzoo",
	Short:         "OpenZoo CLI",
	SilenceUsage:  true,
	SilenceErrors: true,
}

func main() {
	registerCommands(rootCmd)
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, "Error:", err)
		os.Exit(1)
	}
}
