package usage

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type hermesScanner struct{}

func (s *hermesScanner) Name() string { return "hermes" }

func (s *hermesScanner) Scan() []Record {
	root := hermesSessionRoot()
	if root == "" {
		return nil
	}
	pattern := filepath.Join(root, "*.jsonl")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil
	}
	var allRecords []Record
	for _, f := range files {
		record := parseHermesFile(f)
		if record != nil {
			allRecords = append(allRecords, *record)
		}
	}
	return mergeRecords(allRecords)
}

func hermesSessionRoot() string {
	if hermesHome := os.Getenv("HERMES_HOME"); hermesHome != "" {
		dir := filepath.Join(hermesHome, "sessions")
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			return dir
		}
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	candidates := []string{
		filepath.Join(home, ".hermes", "sessions"),
		filepath.Join(home, ".local", "share", "hermes", "sessions"),
		filepath.Join(home, ".config", "hermes", "sessions"),
	}
	for _, dir := range candidates {
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			return dir
		}
	}
	return ""
}

type hermesLine struct {
	Type      string `json:"type"`
	Timestamp string `json:"timestamp"`
	Model     string `json:"model"`
	Usage     *struct {
		InputTokens      int64 `json:"inputTokens"`
		OutputTokens     int64 `json:"outputTokens"`
		CachedReadTokens int64 `json:"cachedReadTokens"`
		ThoughtTokens    int64 `json:"thoughtTokens"`
	} `json:"usage"`
}

func parseHermesFile(path string) *Record {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()
	date := fileModDate(path)
	var lastUsage *hermesUsage
	var lastModel string

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 256*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Text()
		if !strings.Contains(line, `"usage"`) && !strings.Contains(line, `"inputTokens"`) {
			continue
		}
		var entry hermesLine
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		if entry.Usage == nil {
			continue
		}
		lastUsage = &hermesUsage{
			InputTokens:      entry.Usage.InputTokens,
			OutputTokens:     entry.Usage.OutputTokens,
			CachedReadTokens: entry.Usage.CachedReadTokens,
			ThoughtTokens:    entry.Usage.ThoughtTokens,
		}
		if entry.Model != "" {
			lastModel = entry.Model
		}
	}

	if lastUsage == nil {
		return nil
	}
	if lastUsage.InputTokens == 0 && lastUsage.OutputTokens == 0 {
		return nil
	}
	model := lastModel
	if model == "" {
		model = "unknown"
	}
	return &Record{
		Date:         date,
		Provider:     "hermes",
		Model:        model,
		InputTokens:  lastUsage.InputTokens,
		OutputTokens: lastUsage.OutputTokens + lastUsage.ThoughtTokens,
		CacheRead:    lastUsage.CachedReadTokens,
	}
}

type hermesUsage struct {
	InputTokens      int64
	OutputTokens     int64
	CachedReadTokens int64
	ThoughtTokens    int64
}
