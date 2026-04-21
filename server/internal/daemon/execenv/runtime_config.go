package execenv

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func InjectRuntimeConfig(workDir, provider string, params PrepareParams) error {
	var content strings.Builder
	content.WriteString("# Runtime Configuration\n\n")
	content.WriteString(fmt.Sprintf("You are agent **%s** executing a task.\n\n", params.AgentName))
	content.WriteString("## Available Repositories\n\n")
	for _, repo := range params.Repos {
		content.WriteString(fmt.Sprintf("- %s\n  %s\n\n", repo.URL, repo.Description))
	}
	if len(params.Skills) > 0 {
		content.WriteString("## Available Skills\n\n")
		for _, skill := range params.Skills {
			content.WriteString(fmt.Sprintf("- **%s**\n", skill.Name))
		}
		content.WriteString("\n")
	}

	switch provider {
	case "claude":
		return os.WriteFile(filepath.Join(workDir, "CLAUDE.md"), []byte(content.String()), 0644)
	case "codex", "opencode":
		return os.WriteFile(filepath.Join(workDir, "AGENTS.md"), []byte(content.String()), 0644)
	default:
		return nil
	}
}
