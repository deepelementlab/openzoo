package usage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

type opencodeScanner struct{}

func (s *opencodeScanner) Name() string { return "opencode" }

func (s *opencodeScanner) Scan() []Record {
	dataDir := os.Getenv("XDG_DATA_HOME")
	if dataDir == "" {
		dataDir = filepath.Join(os.Getenv("HOME"), ".local", "share")
	}
	msgDir := filepath.Join(dataDir, "opencode", "storage", "message")
	return s.scanDir(msgDir)
}

func (s *opencodeScanner) scanDir(dir string) []Record {
	files, _ := filepath.Glob(filepath.Join(dir, "ses_*", "*.json"))
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

func (s *opencodeScanner) scanFile(path string, daily map[string]*Record) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	var entry struct {
		Role   string `json:"role"`
		Tokens struct {
			Input     int64 `json:"input"`
			Output    int64 `json:"output"`
			Reasoning int64 `json:"reasoning"`
			Cache     struct {
				Read  int64 `json:"read"`
				Write int64 `json:"write"`
			} `json:"cache"`
		} `json:"tokens"`
		Model string `json:"model"`
	}
	if err := json.Unmarshal(data, &entry); err != nil {
		return
	}
	if entry.Role != "assistant" || (entry.Tokens.Input == 0 && entry.Tokens.Output == 0) {
		return
	}
	date := fileModDate(path)
	model := entry.Model
	if model == "" {
		model = "unknown"
	}
	if strings.HasPrefix(filepath.Base(path), "ses_") {
		parts := strings.Split(filepath.Base(filepath.Dir(path)), "_")
		if len(parts) >= 2 {
			date = strings.ReplaceAll(parts[1], "-", "-")[:10]
		}
	}
	key := date + "|opencode|" + model
	if existing, ok := daily[key]; ok {
		existing.InputTokens += entry.Tokens.Input
		existing.OutputTokens += entry.Tokens.Output + entry.Tokens.Reasoning
		existing.CacheRead += entry.Tokens.Cache.Read
		existing.CacheWrite += entry.Tokens.Cache.Write
	} else {
		daily[key] = &Record{
			Date: date, Provider: "opencode", Model: model,
			InputTokens: entry.Tokens.Input, OutputTokens: entry.Tokens.Output + entry.Tokens.Reasoning,
			CacheRead: entry.Tokens.Cache.Read, CacheWrite: entry.Tokens.Cache.Write,
		}
	}
}
