package execenv

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type AgentContext struct {
	AgentName    string
	Instructions string
	Skills       []SkillData
	IssueContext string
}

type SkillData struct {
	Name    string
	Content string
	Files   []SkillFile
}

type SkillFile struct {
	Path    string
	Content string
}

func Prepare(workdir string, ctx AgentContext) error {
	if err := os.MkdirAll(workdir, 0o755); err != nil {
		return fmt.Errorf("create workdir: %w", err)
	}

	var sb strings.Builder

	sb.WriteString("# Agent Configuration\n\n")
	sb.WriteString(fmt.Sprintf("## Agent: %s\n\n", ctx.AgentName))

	if ctx.Instructions != "" {
		sb.WriteString("## Instructions\n\n")
		sb.WriteString(ctx.Instructions)
		sb.WriteString("\n\n")
	}

	if len(ctx.Skills) > 0 {
		sb.WriteString("## Skills\n\n")
		for _, sk := range ctx.Skills {
			sb.WriteString(fmt.Sprintf("### %s\n\n", sk.Name))
			if sk.Content != "" {
				sb.WriteString(sk.Content)
				sb.WriteString("\n\n")
			}
			for _, f := range sk.Files {
				skillFilePath := filepath.Join(workdir, "skills", sk.Name, f.Path)
				if err := os.MkdirAll(filepath.Dir(skillFilePath), 0o755); err != nil {
					return fmt.Errorf("create skill dir: %w", err)
				}
				if err := os.WriteFile(skillFilePath, []byte(f.Content), 0o644); err != nil {
					return fmt.Errorf("write skill file %s: %w", f.Path, err)
				}
			}
		}
	}

	if ctx.IssueContext != "" {
		sb.WriteString("## Issue Context\n\n")
		sb.WriteString(ctx.IssueContext)
		sb.WriteString("\n")
	}

	agentFile := filepath.Join(workdir, "AGENTS.md")
	if err := os.WriteFile(agentFile, []byte(sb.String()), 0o644); err != nil {
		return fmt.Errorf("write AGENTS.md: %w", err)
	}

	return nil
}

func Cleanup(workdir string) error {
	if workdir == "" {
		return nil
	}
	if strings.Contains(workdir, "..") {
		return fmt.Errorf("invalid workdir path")
	}
	return os.RemoveAll(workdir)
}
