package usage

type Record struct {
	Date         string `json:"date"`
	Provider     string `json:"provider"`
	Model        string `json:"model"`
	InputTokens  int64  `json:"input_tokens"`
	OutputTokens int64  `json:"output_tokens"`
	CacheRead    int64  `json:"cache_read"`
	CacheWrite   int64  `json:"cache_write"`
}

type Scanner struct {
	providers []provider
}

type provider interface {
	Name() string
	Scan() []Record
}

func NewScanner() *Scanner {
	return &Scanner{
		providers: []provider{
			&claudeScanner{},
			&codexScanner{},
			&opencodeScanner{},
			&openclawScanner{},
			&hermesScanner{},
		},
	}
}

func (s *Scanner) Scan() []Record {
	var all []Record
	for _, p := range s.providers {
		records := p.Scan()
		if len(records) > 0 {
			all = append(all, records...)
		}
	}
	return mergeRecords(all)
}

func mergeRecords(records []Record) []Record {
	merged := make(map[string]*Record)
	for _, r := range records {
		key := r.Date + "|" + r.Provider + "|" + r.Model
		if existing, ok := merged[key]; ok {
			existing.InputTokens += r.InputTokens
			existing.OutputTokens += r.OutputTokens
			existing.CacheRead += r.CacheRead
			existing.CacheWrite += r.CacheWrite
		} else {
			merged[key] = &Record{
				Date: r.Date, Provider: r.Provider, Model: r.Model,
				InputTokens: r.InputTokens, OutputTokens: r.OutputTokens,
				CacheRead: r.CacheRead, CacheWrite: r.CacheWrite,
			}
		}
	}
	result := make([]Record, 0, len(merged))
	for _, r := range merged {
		result = append(result, *r)
	}
	return result
}
