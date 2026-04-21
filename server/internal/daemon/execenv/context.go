package execenv

import (
	"fmt"
	"os"
	"path/filepath"
)

func writeContextFiles(workDir string, params PrepareParams) error {
	contextDir := filepath.Join(workDir, ".agent_context")
	os.MkdirAll(contextDir, 0755)

	issueContext := params.IssueContext
	if issueContext == "" {
		issueContext = fmt.Sprintf("# Task Assignment\n\nExecute the task associated with issue %s.", params.TaskID)
	}
	if err := os.WriteFile(filepath.Join(contextDir, "issue_context.md"), []byte(issueContext), 0644); err != nil {
		return err
	}

	skillsDir := resolveSkillsDir(workDir, params.Provider)
	if skillsDir != "" {
		os.MkdirAll(skillsDir, 0755)
		for _, skill := range params.Skills {
			skillDir := filepath.Join(skillsDir, skill.Name)
			os.MkdirAll(skillDir, 0755)
			os.WriteFile(filepath.Join(skillDir, "SKILL.md"), []byte(skill.Content), 0644)
			for _, f := range skill.Files {
				os.MkdirAll(filepath.Join(skillDir, filepath.Dir(f.Path)), 0755)
				os.WriteFile(filepath.Join(skillDir, f.Path), []byte(f.Content), 0644)
			}
		}
	}

	return nil
}

func resolveSkillsDir(workDir, provider string) string {
	switch provider {
	case "claude":
		return filepath.Join(workDir, ".claude", "skills")
	case "opencode":
		return filepath.Join(workDir, ".config", "opencode", "skills")
	default:
		return filepath.Join(workDir, ".agent_context", "skills")
	}
}
