package usage

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type claudeScanner struct{}

func (s *claudeScanner) Name() string { return "claude" }

func (s *claudeScanner) Scan() []Record {
	dirs := []string{
		os.Getenv("CLAUDE_CONFIG_DIR"),
		filepath.Join(os.Getenv("HOME"), ".config", "claude", "projects"),
		filepath.Join(os.Getenv("HOME"), ".claude", "projects"),
	}
	var records []Record
	for _, dir := range dirs {
		if dir == "" {
			continue
		}
		records = append(records, s.scanDir(dir)...)
	}
	return records
}

func (s *claudeScanner) scanDir(dir string) []Record {
	files, _ := filepath.Glob(filepath.Join(dir, "**", "*.jsonl"))
	if len(files) == 0 {
		return nil
	}
	dailyUsage := make(map[string]*Record)
	for _, f := range files {
		s.scanFile(f, dailyUsage)
	}
	var records []Record
	for _, r := range dailyUsage {
		records = append(records, *r)
	}
	return records
}

func (s *claudeScanner) scanFile(path string, daily map[string]*Record) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	info, _ := f.Stat()
	date := info.ModTime().Format("2006-01-02")

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.Contains(line, `"type":"assistant"`) && !strings.Contains(line, `"type": "assistant"`) {
			continue
		}
		var entry struct {
			Type  string `json:"type"`
			Usage struct {
				InputTokens  int64 `json:"input_tokens"`
				OutputTokens int64 `json:"output_tokens"`
				CacheRead    int64 `json:"cache_read_input_tokens"`
				CacheWrite   int64 `json:"cache_creation_input_tokens"`
			} `json:"usage"`
			Model string `json:"model"`
		}
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		if entry.Usage.InputTokens == 0 && entry.Usage.OutputTokens == 0 {
			continue
		}
		model := normalizeClaudeModel(entry.Model)
		key := fmt.Sprintf("%s|claude|%s", date, model)
		if existing, ok := daily[key]; ok {
			existing.InputTokens += entry.Usage.InputTokens
			existing.OutputTokens += entry.Usage.OutputTokens
			existing.CacheRead += entry.Usage.CacheRead
			existing.CacheWrite += entry.Usage.CacheWrite
		} else {
			daily[key] = &Record{
				Date: date, Provider: "claude", Model: model,
				InputTokens: entry.Usage.InputTokens, OutputTokens: entry.Usage.OutputTokens,
				CacheRead: entry.Usage.CacheRead, CacheWrite: entry.Usage.CacheWrite,
			}
		}
	}
}

func normalizeClaudeModel(model string) string {
	model = strings.TrimPrefix(model, "anthropic.")
	model = strings.TrimPrefix(model, "vertex-ai.")
	if idx := strings.LastIndex(model, "/"); idx >= 0 {
		model = model[idx+1:]
	}
	return model
}

func fileModDate(path string) string {
	info, err := os.Stat(path)
	if err != nil {
		return time.Now().Format("2006-01-02")
	}
	return info.ModTime().Format("2006-01-02")
}
