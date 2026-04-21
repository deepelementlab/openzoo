package usage

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type codexScanner struct{}

func (s *codexScanner) Name() string { return "codex" }

func (s *codexScanner) Scan() []Record {
	codexHome := os.Getenv("CODEX_HOME")
	if codexHome == "" {
		codexHome = filepath.Join(os.Getenv("HOME"), ".codex")
	}
	sessionsDir := filepath.Join(codexHome, "sessions")
	return s.scanDir(sessionsDir)
}

func (s *codexScanner) scanDir(dir string) []Record {
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

func (s *codexScanner) scanFile(path string, daily map[string]*Record) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	date := fileModDate(path)
	var lastModel string

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		var entry map[string]interface{}
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		if t, ok := entry["type"].(string); ok {
			if t == "turn_context" {
				if m, ok := entry["model"].(string); ok {
					lastModel = m
				}
			}
			if t == "token_count" {
				input, _ := entry["input_tokens"].(float64)
				output, _ := entry["output_tokens"].(float64)
				reasoning, _ := entry["reasoning_output_tokens"].(float64)
				var cacheRead float64
				if cr, ok := entry["cached_input_tokens"].(float64); ok {
					cacheRead = cr
				} else if cr, ok := entry["cache_read_input_tokens"].(float64); ok {
					cacheRead = cr
				}
				model := lastModel
				if model == "" {
					model = "unknown"
				}
				key := date + "|codex|" + model
				if existing, ok := daily[key]; ok {
					existing.InputTokens = int64(input)
					existing.OutputTokens = int64(output + reasoning)
					existing.CacheRead = int64(cacheRead)
				} else {
					daily[key] = &Record{
						Date: date, Provider: "codex", Model: model,
						InputTokens: int64(input), OutputTokens: int64(output + reasoning),
						CacheRead: int64(cacheRead),
					}
				}
			}
		}
	}
	_ = strings.TrimSpace
}
