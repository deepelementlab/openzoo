package main

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"

	"github.com/spf13/cobra"
)

var version string
var commit string
var date string

func init() {
	versionCmd.Flags().String("output", "text", "Output format: text or json")
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	RunE:  runVersion,
}

func runVersion(cmd *cobra.Command, _ []string) error {
	output, _ := cmd.Flags().GetString("output")
	v := version
	if v == "" {
		v = "dev"
	}
	c := commit
	if c == "" {
		c = "unknown"
	}
	d := date
	if d == "" {
		d = "unknown"
	}

	if output == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(map[string]string{
			"version": v,
			"commit":  c,
			"date":    d,
			"go":      runtime.Version(),
			"os":      runtime.GOOS,
			"arch":    runtime.GOARCH,
		})
	}

	fmt.Printf("openzoo %s (commit: %s, built: %s)\n", v, c, d)
	fmt.Printf("go: %s, os/arch: %s/%s\n", runtime.Version(), runtime.GOOS, runtime.GOARCH)
	return nil
}
