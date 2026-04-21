package daemon

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	ServerURL          string
	Token              string
	DaemonID           string
	DeviceName         string
	WorkspaceIDs       []string
	MaxConcurrentTasks int
	PollInterval       time.Duration
	HeartbeatInterval  time.Duration
	AgentTimeout       time.Duration
	WorkDir            string
	HealthPort         int
	Agents             map[string]AgentEntry
	ConfigPath         string

	ExternalDiscoveryEnabled  bool
	ExternalDiscoveryInterval time.Duration
	ExternalSessionDir        string
	ExternalAutoAdopt         bool
	ExternalMonitorDefault    bool
}

func DefaultConfig() *Config {
	hostname, _ := os.Hostname()
	return &Config{
		ServerURL:          "http://localhost:8080",
		DaemonID:           fmt.Sprintf("daemon-%s", hostname),
		DeviceName:         hostname,
		MaxConcurrentTasks: 5,
		PollInterval:       3 * time.Second,
		HeartbeatInterval:  15 * time.Second,
		AgentTimeout:       2 * time.Hour,
		WorkDir:            filepath.Join(os.TempDir(), "openzoo-work"),
		HealthPort:         19514,
		Agents:             make(map[string]AgentEntry),
		ExternalDiscoveryEnabled:  os.Getenv("OPENZOO_EXTERNAL_DISCOVERY_ENABLED") != "false",
		ExternalDiscoveryInterval: 30 * time.Second,
		ExternalSessionDir:        defaultClaudeDir(),
		ExternalAutoAdopt:         os.Getenv("OPENZOO_EXTERNAL_AUTO_ADOPT") == "true",
		ExternalMonitorDefault:    os.Getenv("OPENZOO_EXTERNAL_MONITOR_BY_DEFAULT") != "false",
	}
}

func LoadConfig(overrides *Config) *Config {
	cfg := DefaultConfig()
	if overrides != nil {
		if overrides.ServerURL != "" {
			cfg.ServerURL = overrides.ServerURL
		}
		if overrides.Token != "" {
			cfg.Token = overrides.Token
		}
		if overrides.DaemonID != "" {
			cfg.DaemonID = overrides.DaemonID
		}
		if overrides.WorkDir != "" {
			cfg.WorkDir = overrides.WorkDir
		}
		if overrides.HealthPort > 0 {
			cfg.HealthPort = overrides.HealthPort
		}
		if overrides.MaxConcurrentTasks > 0 {
			cfg.MaxConcurrentTasks = overrides.MaxConcurrentTasks
		}
		if len(overrides.WorkspaceIDs) > 0 {
			cfg.WorkspaceIDs = overrides.WorkspaceIDs
		}
		if overrides.ConfigPath != "" {
			cfg.ConfigPath = overrides.ConfigPath
		}
	}

	cfg.Agents = detectAgents()
	return cfg
}

func detectAgents() map[string]AgentEntry {
	agents := make(map[string]AgentEntry)

	detectAgent := func(name, envPath string) {
		path := os.Getenv(envPath)
		if path == "" {
			p, err := exec.LookPath(name)
			if err != nil {
				return
			}
			path = p
		}
		if path != "" {
			if _, err := os.Stat(path); err == nil {
				agents[name] = AgentEntry{Path: path}
			}
		}
	}

	detectAgent("claude", "OPENZOO_CLAUDE_PATH")
	detectAgent("codex", "OPENZOO_CODEX_PATH")
	detectAgent("opencode", "OPENZOO_OPENCODE_PATH")

	return agents
}

func ConfigModTime(path string) (int64, bool) {
	if path == "" {
		return 0, false
	}
	info, err := os.Stat(path)
	if err != nil {
		return 0, false
	}
	return info.ModTime().UnixNano(), true
}

func ParseWorkspaceIDsFromConfig(path string) []string {
	if path == "" {
		return nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	content := string(data)
	var ids []string
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "workspace_id=") {
			id := strings.TrimPrefix(line, "workspace_id=")
			id = strings.TrimSpace(id)
			if id != "" {
				ids = append(ids, id)
			}
		}
		if strings.HasPrefix(line, "workspace_ids=") {
			val := strings.TrimPrefix(line, "workspace_ids=")
			for _, id := range strings.Split(val, ",") {
				id = strings.TrimSpace(id)
				if id != "" {
					ids = append(ids, id)
				}
			}
		}
	}
	return ids
}

func defaultClaudeDir() string {
	if dir := os.Getenv("OPENZOO_EXTERNAL_SESSION_DIR"); dir != "" {
		return dir
	}
	home, err := os.UserHomeDir()
	if err != nil {
		home = os.Getenv("USERPROFILE")
	}
	if home == "" {
		home = os.Getenv("HOME")
	}
	if home == "" {
		return filepath.Join(os.TempDir(), ".claude")
	}
	return filepath.Join(home, ".claude")
}
