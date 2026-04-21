package discovery

import (
	"bufio"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type SessionInfo struct {
	SessionID       string    `json:"session_id"`
	ProjectPath     string    `json:"project_path"`
	SessionFilePath string    `json:"session_file_path"`
	CreatedAt       time.Time `json:"created_at"`
	LastModified    time.Time `json:"last_modified"`
	Model           string    `json:"model"`
	IsActive        bool      `json:"is_active"`
}

type SessionEvent struct {
	Type      string `json:"type"`
	Line      string `json:"line"`
	Timestamp time.Time
}

func ScanClaudeSessions(ctx context.Context) ([]SessionInfo, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	claudeDir := filepath.Join(homeDir, ".claude")
	projectsDir := filepath.Join(claudeDir, "projects")

	if _, err := os.Stat(projectsDir); os.IsNotExist(err) {
		return nil, nil
	}

	return scanProjectsDir(ctx, projectsDir)
}

func scanProjectsDir(ctx context.Context, projectsDir string) ([]SessionInfo, error) {
	result := make([]SessionInfo, 0)

	projectEntries, err := os.ReadDir(projectsDir)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	activeThreshold := 30 * time.Minute

	for _, pe := range projectEntries {
		if !pe.IsDir() {
			continue
		}

		projectPath := filepath.Join(projectsDir, pe.Name())

		sessionEntries, err := os.ReadDir(projectPath)
		if err != nil {
			continue
		}

		for _, se := range sessionEntries {
			if se.IsDir() {
				continue
			}
			name := se.Name()
			if !strings.HasSuffix(name, ".jsonl") {
				continue
			}

			info, err := se.Info()
			if err != nil {
				continue
			}

			sessionFilePath := filepath.Join(projectPath, name)
			sessionID := strings.TrimSuffix(name, ".jsonl")

			decodedProjectPath := decodeProjectPath(pe.Name())

			si := SessionInfo{
				SessionID:       sessionID,
				ProjectPath:     decodedProjectPath,
				SessionFilePath: sessionFilePath,
				LastModified:    info.ModTime(),
				CreatedAt:       info.ModTime(),
				IsActive:        now.Sub(info.ModTime()) < activeThreshold,
			}

			parseSessionMetadata(sessionFilePath, &si)
			result = append(result, si)
		}
	}

	return result, nil
}

func parseSessionMetadata(filePath string, si *SessionInfo) {
	f, err := os.Open(filePath)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	lineCount := 0
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		lineCount++
		if lineCount > 50 {
			break
		}

		var evt map[string]interface{}
		if json.Unmarshal([]byte(line), &evt) != nil {
			continue
		}

		if sid, ok := evt["sessionId"].(string); ok && sid != "" {
			si.SessionID = sid
		}
		if ver, ok := evt["version"].(string); ok && ver != "" {
			if si.Model == "" {
				si.Model = "claude " + ver
			}
		}
		if cwd, ok := evt["cwd"].(string); ok && cwd != "" && si.ProjectPath == "" {
			si.ProjectPath = cwd
		}

		if msg, ok := evt["message"].(map[string]interface{}); ok {
			if model, ok := msg["model"].(string); ok && model != "" {
				si.Model = model
			}
		}
	}
}

func decodeProjectPath(dirName string) string {
	if runtime.GOOS == "windows" {
		if len(dirName) > 0 && dirName[0] == '-' {
			dirName = dirName[1:]
			idx := strings.Index(dirName, "-")
			if idx > 0 {
				dirName = dirName[:idx] + ":" + dirName[idx+1:]
			}
		}
		dirName = strings.ReplaceAll(dirName, "-", string(filepath.Separator))
	} else {
		dirName = strings.ReplaceAll(dirName, "-", string(filepath.Separator))
	}
	return filepath.Clean(dirName)
}

func WatchSessionFile(ctx context.Context, filePath string) (<-chan SessionEvent, error) {
	eventCh := make(chan SessionEvent, 256)

	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}

	go func() {
		defer close(eventCh)
		defer f.Close()

		if _, err := f.Seek(0, 2); err != nil {
			return
		}

		reader := bufio.NewReader(f)
		var partialLine strings.Builder

		ticker := time.NewTicker(200 * time.Millisecond)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				for {
					line, err := reader.ReadString('\n')
					if err != nil {
						if len(line) > 0 {
							partialLine.WriteString(line)
						}
						break
					}
					if partialLine.Len() > 0 {
						partialLine.WriteString(line)
						line = partialLine.String()
						partialLine.Reset()
					}

					line = strings.TrimSpace(line)
					if line == "" {
						continue
					}

					select {
					case eventCh <- SessionEvent{
						Type:      "line",
						Line:      line,
						Timestamp: time.Now(),
					}:
					default:
					}
				}
			}
		}
	}()

	return eventCh, nil
}
