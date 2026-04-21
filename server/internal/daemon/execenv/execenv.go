package execenv

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
)

type Environment struct {
	RootDir  string
	WorkDir  string
	CodexHome string
	logger   *log.Logger
}

type PrepareParams struct {
	WorkspaceID string
	TaskID      shortID
	Provider    string
	AgentName   string
	Repos       []RepoInfo
	Skills      []SkillData
	IssueContext string
}

type RepoInfo struct {
	URL         string
	Description string
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

type shortID = string

func shortTaskID(id string) string {
	if len(id) >= 8 {
		return id[:8]
	}
	return id
}

func Prepare(rootDir string, params PrepareParams, logger *log.Logger) (*Environment, error) {
	taskDir := filepath.Join(rootDir, params.WorkspaceID, shortTaskID(params.TaskID))
	workDir := filepath.Join(taskDir, "workdir")
	outputDir := filepath.Join(taskDir, "output")
	logsDir := filepath.Join(taskDir, "logs")

	for _, dir := range []string{workDir, outputDir, logsDir} {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("create dir %s: %w", dir, err)
		}
	}

	env := &Environment{
		RootDir: rootDir,
		WorkDir: workDir,
		logger:  logger,
	}

	if params.Provider == "codex" {
		env.CodexHome = filepath.Join(taskDir, "codex-home")
		os.MkdirAll(env.CodexHome, 0755)
	}

	if err := writeContextFiles(workDir, params); err != nil {
		logger.Printf("warning: write context files: %v", err)
	}

	return env, nil
}

func Reuse(workDir, provider string, params PrepareParams, logger *log.Logger) (*Environment, error) {
	if _, err := os.Stat(workDir); err != nil {
		return nil, fmt.Errorf("workdir %s does not exist: %w", workDir, err)
	}

	if err := writeContextFiles(workDir, params); err != nil {
		logger.Printf("warning: write context files: %v", err)
	}

	return &Environment{
		RootDir: filepath.Dir(filepath.Dir(workDir)),
		WorkDir: workDir,
		logger:  logger,
	}, nil
}

func (e *Environment) Cleanup(removeAll bool) {
	if removeAll {
		os.RemoveAll(filepath.Dir(e.RootDir))
		return
	}
	taskDir := filepath.Dir(e.WorkDir)
	outputDir := filepath.Join(taskDir, "output")
	logsDir := filepath.Join(taskDir, "logs")
	for _, dir := range []string{outputDir, logsDir} {
		os.MkdirAll(dir, 0755)
	}
}
