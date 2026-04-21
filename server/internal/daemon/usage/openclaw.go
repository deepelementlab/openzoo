package usage

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type openclawScanner struct{}

func (s *openclawScanner) Name() string { return "openclaw" }

func (s *openclawScanner) Scan() []Record {
	root := openClawSessionRoot()
	if root == "" {
		return nil
	}
	pattern := filepath.Join(root, "*", "sessions", "*.jsonl")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil
	}
	var allRecords []Record
	for _, f := range files {
		records := parseOpenClawFile(f)
		allRecords = append(allRecords, records...)
	}
	return mergeRecords(allRecords)
}

func openClawSessionRoot() string {
	if openclawHome := os.Getenv("OPENCLAW_HOME"); openclawHome != "" {
		dir := filepath.Join(openclawHome, "agents")
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			return dir
		}
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	dir := filepath.Join(home, ".openclaw", "agents")
	if info, err := os.Stat(dir); err == nil && info.IsDir() {
		return dir
	}
	return ""
}

type openClawLine struct {
	Type      string `json:"type"`
	Timestamp string `json:"timestamp"`
	Message   *struct {
		Role     string `json:"role"`
		Provider string `json:"provider"`
		Model    string `json:"model"`
		Usage    *struct {
			Input      int64 `json:"input"`
			Output     int64 `json:"output"`
			CacheRead  int64 `json:"cacheRead"`
			CacheWrite int64 `json:"cacheWrite"`
		} `json:"usage"`
	} `json:"message"`
}

func parseOpenClawFile(path string) []Record {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()
	date := fileModDate(path)
	var records []Record
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 256*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.Contains(line, `"usage"`) || !strings.Contains(line, `"assistant"`) {
			continue
		}
		var entry openClawLine
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		if entry.Type != "message" || entry.Message == nil || entry.Message.Role != "assistant" || entry.Message.Usage == nil {
			continue
		}
		u := entry.Message.Usage
		if u.Input == 0 && u.Output == 0 {
			continue
		}
		model := entry.Message.Model
		if model == "" {
			model = "unknown"
		}
		records = append(records, Record{
			Date:         date,
			Provider:     "openclaw",
			Model:        normalizeOpenClawModel(entry.Message.Provider, model),
			InputTokens:  u.Input,
			OutputTokens: u.Output,
			CacheRead:    u.CacheRead,
			CacheWrite:   u.CacheWrite,
		})
	}
	return records
}

func normalizeOpenClawModel(provider, model string) string {
	provider = strings.TrimSpace(provider)
	model = strings.TrimSpace(model)
	if provider != "" && !strings.Contains(model, "/") {
		return provider + "/" + model
	}
	return model
}
