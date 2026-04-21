package main

import (
	"fmt"
	"strings"
	"text/template"

	"github.com/spf13/cobra"
)

const (
	groupCore       = "core"
	groupRuntime    = "runtime"
	groupAdditional = "additional"
)

func initHelp(root *cobra.Command) {
	root.SetHelpTemplate(rootHelpTemplate)
	root.SetUsageTemplate(rootHelpTemplate)
	root.CompletionOptions.HiddenDefaultCmd = true

	root.AddGroup(
		&cobra.Group{ID: groupCore, Title: "CORE COMMANDS"},
		&cobra.Group{ID: groupRuntime, Title: "RUNTIME COMMANDS"},
		&cobra.Group{ID: groupAdditional, Title: "ADDITIONAL COMMANDS"},
	)

	applyTemplates(root)
}

func applyTemplates(cmd *cobra.Command) {
	for _, c := range cmd.Commands() {
		if c.HasSubCommands() {
			c.SetHelpTemplate(subHelpTemplate)
			c.SetUsageTemplate(subHelpTemplate)
		} else {
			c.SetHelpTemplate(leafHelpTemplate)
			c.SetUsageTemplate(leafHelpTemplate)
		}
		applyTemplates(c)
	}
}

func formatCommandList(cmds []*cobra.Command) string {
	if len(cmds) == 0 {
		return ""
	}
	maxLen := 0
	for _, c := range cmds {
		if c.IsAvailableCommand() && len(c.Name()) > maxLen {
			maxLen = len(c.Name())
		}
	}
	var b strings.Builder
	for _, c := range cmds {
		if !c.IsAvailableCommand() {
			continue
		}
		padding := strings.Repeat(" ", maxLen-len(c.Name()))
		fmt.Fprintf(&b, "  %s:%s  %s\n", c.Name(), padding, c.Short)
	}
	return b.String()
}

func commandsInGroup(cmds []*cobra.Command, groupID string) []*cobra.Command {
	var result []*cobra.Command
	for _, c := range cmds {
		if c.GroupID == groupID && c.IsAvailableCommand() {
			result = append(result, c)
		}
	}
	return result
}

func init() {
	cobra.AddTemplateFuncs(template.FuncMap{
		"formatCommandList": formatCommandList,
		"commandsInGroup":   commandsInGroup,
	})
}

var rootHelpTemplate = `Work seamlessly with OpenZoo from the command line.

USAGE
  openzoo <command> <subcommand> [flags]
{{range .Groups}}
{{.Title}}
{{formatCommandList (commandsInGroup $.Commands .ID)}}
{{- end}}
FLAGS
{{.LocalFlags.FlagUsages}}
EXAMPLES
  $ openzoo login
  $ openzoo issue list --output json
  $ openzoo daemon start
  $ openzoo agent list

ENVIRONMENT VARIABLES
  OPENZOO_SERVER_URL     Override the default server URL
  OPENZOO_WORKSPACE_ID   Set the active workspace

LEARN MORE
  Use ` + "`openzoo <command> <subcommand> --help`" + ` for more information about a command.
`

var subHelpTemplate = `{{.Short}}

USAGE
  {{.CommandPath}} <command> [flags]

COMMANDS
{{formatCommandList .Commands}}
INHERITED FLAGS
  --help   Show help for command
{{- if .Example}}

EXAMPLES
{{.Example}}
{{- end}}

LEARN MORE
  Use ` + "`{{.CommandPath}} <command> --help`" + ` for more information about a command.
`

var leafHelpTemplate = `{{if .Long}}{{.Long}}{{else}}{{.Short}}{{end}}

USAGE
  {{.UseLine}}
{{- if .HasLocalFlags}}

FLAGS
{{.LocalFlags.FlagUsages}}
{{- end}}
INHERITED FLAGS
  --help   Show help for command
{{- if .Example}}

EXAMPLES
{{.Example}}
{{- end}}

LEARN MORE
  Use ` + "`openzoo <command> <subcommand> --help`" + ` for more information about a command.
`
