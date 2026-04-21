package execenv

import (
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

func detectGitRepo(dir string) (string, bool) {
	cmd := exec.Command("git", "-C", dir, "rev-parse", "--show-toplevel")
	if out, err := cmd.Output(); err == nil {
		return strings.TrimSpace(string(out)), true
	}
	cmd = exec.Command("git", "-C", dir, "rev-parse", "--is-bare-repository")
	if out, err := cmd.Output(); err == nil && strings.TrimSpace(string(out)) == "true" {
		return dir, true
	}
	return "", false
}

func fetchOrigin(gitRoot string) error {
	cmd := exec.Command("git", "-C", gitRoot, "fetch", "origin")
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git fetch origin: %s: %w", strings.TrimSpace(string(out)), err)
	}
	return nil
}

func getRemoteDefaultBranch(gitRoot string) string {
	cmd := exec.Command("git", "-C", gitRoot, "symbolic-ref", "refs/remotes/origin/HEAD")
	if out, err := cmd.Output(); err == nil {
		ref := strings.TrimSpace(string(out))
		if strings.HasPrefix(ref, "refs/remotes/") {
			return strings.TrimPrefix(ref, "refs/remotes/")
		}
		return ref
	}
	cmd = exec.Command("git", "-C", gitRoot, "rev-parse", "--verify", "origin/main")
	if err := cmd.Run(); err == nil {
		return "origin/main"
	}
	cmd = exec.Command("git", "-C", gitRoot, "rev-parse", "--verify", "origin/master")
	if err := cmd.Run(); err == nil {
		return "origin/master"
	}
	return "HEAD"
}

func setupGitWorktree(gitRoot, worktreePath, branchName, baseRef string) error {
	if err := os.Remove(worktreePath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("remove placeholder workdir: %w", err)
	}
	err := runGitWorktreeAdd(gitRoot, worktreePath, branchName, baseRef)
	if err != nil && strings.Contains(err.Error(), "already exists") {
		branchName = fmt.Sprintf("%s-%d", branchName, time.Now().Unix())
		err = runGitWorktreeAdd(gitRoot, worktreePath, branchName, baseRef)
	}
	return err
}

func runGitWorktreeAdd(gitRoot, worktreePath, branchName, baseRef string) error {
	cmd := exec.Command("git", "-C", gitRoot, "worktree", "add", "-b", branchName, worktreePath, baseRef)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("git worktree add: %s: %w", strings.TrimSpace(string(out)), err)
	}
	return nil
}

func removeGitWorktree(gitRoot, worktreePath, branchName string, logger *slog.Logger) {
	cmd := exec.Command("git", "-C", gitRoot, "worktree", "remove", "--force", worktreePath)
	if out, err := cmd.CombinedOutput(); err != nil {
		logger.Warn("execenv: git worktree remove failed", "output", strings.TrimSpace(string(out)), "error", err)
	}
	if branchName != "" {
		cmd = exec.Command("git", "-C", gitRoot, "branch", "-D", branchName)
		if out, err := cmd.CombinedOutput(); err != nil {
			logger.Warn("execenv: git branch delete failed", "branch", branchName, "output", strings.TrimSpace(string(out)), "error", err)
		}
	}
}

func excludeFromGit(worktreePath, pattern string) error {
	cmd := exec.Command("git", "-C", worktreePath, "rev-parse", "--git-dir")
	out, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("resolve git dir: %w", err)
	}
	gitDir := strings.TrimSpace(string(out))
	if !filepath.IsAbs(gitDir) {
		gitDir = filepath.Join(worktreePath, gitDir)
	}
	excludePath := filepath.Join(gitDir, "info", "exclude")
	if err := os.MkdirAll(filepath.Dir(excludePath), 0o755); err != nil {
		return fmt.Errorf("create info dir: %w", err)
	}
	existing, _ := os.ReadFile(excludePath)
	if strings.Contains(string(existing), pattern) {
		return nil
	}
	f, err := os.OpenFile(excludePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return fmt.Errorf("open exclude file: %w", err)
	}
	defer f.Close()
	if _, err := fmt.Fprintf(f, "\n%s\n", pattern); err != nil {
		return fmt.Errorf("write exclude pattern: %w", err)
	}
	return nil
}

func repoNameFromURL(url string) string {
	url = strings.TrimRight(url, "/")
	url = strings.TrimSuffix(url, ".git")
	if i := strings.LastIndex(url, "/"); i >= 0 {
		url = url[i+1:]
	}
	if i := strings.LastIndex(url, ":"); i >= 0 {
		url = url[i+1:]
		if j := strings.LastIndex(url, "/"); j >= 0 {
			url = url[j+1:]
		}
	}
	name := strings.TrimSpace(url)
	if name == "" {
		return "repo"
	}
	return name
}

func truncateID(uuid string) string {
	s := strings.ReplaceAll(uuid, "-", "")
	if len(s) > 8 {
		return s[:8]
	}
	return s
}

var nonAlphanumeric = regexp.MustCompile(`[^a-z0-9]+`)

func sanitizeName(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = nonAlphanumeric.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 30 {
		s = s[:30]
		s = strings.TrimRight(s, "-")
	}
	if s == "" {
		s = "agent"
	}
	return s
}
