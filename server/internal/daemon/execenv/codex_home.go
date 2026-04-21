package execenv

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

var codexSymlinkedDirs = []string{
	"sessions",
}

var codexSymlinkedFiles = []string{
	"auth.json",
}

var codexCopiedFiles = []string{
	"config.json",
	"config.toml",
	"instructions.md",
}

func prepareCodexHome(codexHome string, logger *slog.Logger) error {
	sharedHome := resolveSharedCodexHome()
	if err := os.MkdirAll(codexHome, 0o755); err != nil {
		return fmt.Errorf("create codex-home dir: %w", err)
	}
	for _, name := range codexSymlinkedDirs {
		src := filepath.Join(sharedHome, name)
		dst := filepath.Join(codexHome, name)
		if err := ensureDirSymlink(src, dst); err != nil {
			logger.Warn("execenv: codex-home dir symlink failed", "dir", name, "error", err)
		}
	}
	for _, name := range codexSymlinkedFiles {
		src := filepath.Join(sharedHome, name)
		dst := filepath.Join(codexHome, name)
		if err := ensureSymlink(src, dst); err != nil {
			logger.Warn("execenv: codex-home symlink failed", "file", name, "error", err)
		}
	}
	for _, name := range codexCopiedFiles {
		src := filepath.Join(sharedHome, name)
		dst := filepath.Join(codexHome, name)
		if err := copyFileIfExists(src, dst); err != nil {
			logger.Warn("execenv: codex-home copy failed", "file", name, "error", err)
		}
	}
	if err := ensureCodexNetworkAccess(filepath.Join(codexHome, "config.toml")); err != nil {
		logger.Warn("execenv: codex-home ensure network access failed", "error", err)
	}
	return nil
}

func resolveSharedCodexHome() string {
	if v := os.Getenv("CODEX_HOME"); v != "" {
		abs, err := filepath.Abs(v)
		if err == nil {
			return abs
		}
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join("/tmp", ".codex")
	}
	return filepath.Join(home, ".codex")
}

func ensureDirSymlink(src, dst string) error {
	if err := os.MkdirAll(src, 0o755); err != nil {
		return fmt.Errorf("create shared dir %s: %w", src, err)
	}
	if fi, err := os.Lstat(dst); err == nil {
		if fi.Mode()&os.ModeSymlink != 0 {
			target, err := os.Readlink(dst)
			if err == nil && target == src {
				return nil
			}
			os.Remove(dst)
		} else {
			return nil
		}
	}
	return os.Symlink(src, dst)
}

func ensureSymlink(src, dst string) error {
	if _, err := os.Stat(src); os.IsNotExist(err) {
		return nil
	}
	if fi, err := os.Lstat(dst); err == nil {
		if fi.Mode()&os.ModeSymlink != 0 {
			target, err := os.Readlink(dst)
			if err == nil && target == src {
				return nil
			}
			os.Remove(dst)
		} else {
			return nil
		}
	}
	return os.Symlink(src, dst)
}

const defaultCodexConfig = `sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
`

func ensureCodexNetworkAccess(configPath string) error {
	data, err := os.ReadFile(configPath)
	if os.IsNotExist(err) {
		return os.WriteFile(configPath, []byte(defaultCodexConfig), 0o644)
	}
	if err != nil {
		return fmt.Errorf("read config.toml: %w", err)
	}
	content := string(data)
	if strings.Contains(content, "[sandbox_workspace_write]") && strings.Contains(content, "network_access") {
		return nil
	}
	if strings.Contains(content, "[sandbox_workspace_write]") {
		content = strings.Replace(content, "[sandbox_workspace_write]", "[sandbox_workspace_write]\nnetwork_access = true", 1)
		return os.WriteFile(configPath, []byte(content), 0o644)
	}
	appendStr := "\n"
	if !strings.Contains(content, "sandbox_mode") {
		appendStr += "sandbox_mode = \"workspace-write\"\n"
	}
	appendStr += "\n[sandbox_workspace_write]\nnetwork_access = true\n"
	return os.WriteFile(configPath, append(data, []byte(appendStr)...), 0o644)
}

func copyFileIfExists(src, dst string) error {
	if _, err := os.Stat(src); os.IsNotExist(err) {
		return nil
	}
	if _, err := os.Stat(dst); err == nil {
		return nil
	}
	in, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("open %s: %w", src, err)
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return fmt.Errorf("create %s: %w", dst, err)
	}
	defer out.Close()
	if _, err := io.Copy(out, in); err != nil {
		return fmt.Errorf("copy %s -> %s: %w", src, dst, err)
	}
	return nil
}
