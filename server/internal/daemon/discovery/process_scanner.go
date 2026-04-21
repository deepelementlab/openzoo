package discovery

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

type ProcessInfo struct {
	PID       int    `json:"pid"`
	Name      string `json:"name"`
	ExecPath  string `json:"exec_path"`
	Cwd       string `json:"cwd"`
	CmdLine   string `json:"cmd_line"`
	SessionID string `json:"session_id"`
	ParentPID int    `json:"parent_pid"`
}

type psEntry struct {
	ProcessId      int    `json:"ProcessId"`
	ParentProcessId int   `json:"ParentProcessId"`
	ExecutablePath string `json:"ExecutablePath"`
	CommandLine    string `json:"CommandLine"`
}

func ScanClaudeProcesses(ctx context.Context) ([]ProcessInfo, error) {
	switch runtime.GOOS {
	case "windows":
		return scanClaudeProcessesWindows(ctx)
	case "darwin", "linux":
		return scanClaudeProcessesUnix(ctx)
	default:
		return nil, nil
	}
}

func scanClaudeProcessesWindows(ctx context.Context) ([]ProcessInfo, error) {
	result := make([]ProcessInfo, 0)

	claudeEntries, err := queryWMIProcesses(ctx, "Name='claude.exe' OR Name='claude'")
	if err == nil {
		for _, e := range claudeEntries {
			pi := psEntryToProcessInfo(e, "claude")
			result = append(result, pi)
		}
	}

	nodeEntries, err := queryWMIProcesses(ctx, "Name='node.exe'")
	if err == nil {
		for _, e := range nodeEntries {
			if e.CommandLine != "" && isClaudeNodeProcess(e.CommandLine) {
				pi := psEntryToProcessInfo(e, "claude-node")
				result = append(result, pi)
			}
		}
	}

	return result, nil
}

func queryWMIProcesses(ctx context.Context, filter string) ([]psEntry, error) {
	cmd := exec.CommandContext(ctx, "powershell", "-NoProfile", "-Command",
		"Get-CimInstance Win32_Process -Filter \""+filter+"\" | "+
			"Select-Object ProcessId, ParentProcessId, ExecutablePath, CommandLine | ConvertTo-Json -Compress")

	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	outputStr := strings.TrimSpace(string(output))
	if outputStr == "" || outputStr == "null" {
		return nil, nil
	}

	var entries []psEntry
	if strings.HasPrefix(outputStr, "{") {
		var single psEntry
		if err := json.Unmarshal([]byte(outputStr), &single); err != nil {
			return nil, err
		}
		entries = []psEntry{single}
	} else {
		if err := json.Unmarshal([]byte(outputStr), &entries); err != nil {
			return nil, err
		}
	}
	return entries, nil
}

func isClaudeNodeProcess(cmdLine string) bool {
	cl := strings.ToLower(cmdLine)
	return strings.Contains(cl, "@anthropic-ai/claude-code") ||
		strings.Contains(cl, "claude-code") ||
		strings.Contains(cl, "\\claude\\") ||
		strings.Contains(cl, "/claude/")
}

func psEntryToProcessInfo(e psEntry, name string) ProcessInfo {
	pi := ProcessInfo{
		PID:       e.ProcessId,
		ParentPID: e.ParentProcessId,
		Name:      name,
		ExecPath:  e.ExecutablePath,
		CmdLine:   e.CommandLine,
		SessionID: extractSessionIDFromArgs(e.CommandLine),
	}
	pi.Cwd = extractCwdFromArgs(e.CommandLine)
	return pi
}

func scanClaudeProcessesUnix(ctx context.Context) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	result := make([]ProcessInfo, 0)
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 11 {
			continue
		}
		cmdStr := strings.Join(fields[10:], " ")
		cl := strings.ToLower(cmdStr)
		if !strings.Contains(cl, "claude") {
			continue
		}
		if strings.Contains(cmdStr, "grep") || strings.Contains(cmdStr, "ps aux") {
			continue
		}

		pid := 0
		for i, f := range fields {
			if i == 1 {
				for _, c := range f {
					if c >= '0' && c <= '9' {
						pid = pid*10 + int(c-'0')
					} else {
						break
					}
				}
				break
			}
		}

		pi := ProcessInfo{
			PID:       pid,
			Name:      "claude",
			CmdLine:   cmdStr,
			SessionID: extractSessionIDFromArgs(cmdStr),
		}

		if runtime.GOOS == "linux" && pid > 0 {
			cwdBytes, err := os.Readlink("/proc/" + strings.TrimSpace(fields[1]) + "/cwd")
			if err == nil {
				pi.Cwd = cwdBytes
			}
		}

		result = append(result, pi)
	}
	return result, nil
}

func extractSessionIDFromArgs(cmdLine string) string {
	if cmdLine == "" {
		return ""
	}
	parts := strings.Fields(cmdLine)
	for i, p := range parts {
		if p == "--resume" && i+1 < len(parts) {
			return parts[i+1]
		}
		if strings.HasPrefix(p, "--resume=") {
			return strings.TrimPrefix(p, "--resume=")
		}
		if p == "--session-id" && i+1 < len(parts) {
			return parts[i+1]
		}
		if strings.HasPrefix(p, "--session-id=") {
			return strings.TrimPrefix(p, "--session-id=")
		}
	}
	return ""
}

func extractCwdFromArgs(cmdLine string) string {
	if cmdLine == "" {
		return ""
	}
	parts := strings.Fields(cmdLine)
	for i, p := range parts {
		if p == "--cwd" && i+1 < len(parts) {
			return parts[i+1]
		}
		if p == "-d" && i+1 < len(parts) {
			return parts[i+1]
		}
		if strings.HasPrefix(p, "--cwd=") {
			return strings.TrimPrefix(p, "--cwd=")
		}
	}
	return ""
}

func IsProcessRunning(pid int) bool {
	if pid <= 0 {
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	err = proc.Signal(nil)
	return err == nil
}
