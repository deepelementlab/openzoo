package redact

import (
	"os"
	"os/user"
	"regexp"
	"strings"
)

type secretPattern struct {
	re          *regexp.Regexp
	replacement string
}

var patterns = []secretPattern{
	{regexp.MustCompile(`\bAKIA[0-9A-Z]{16}\b`), "[REDACTED AWS KEY]"},
	{regexp.MustCompile(`(?i)(?:aws_secret_access_key|secret_?access_?key)\s*[=:]\s*[A-Za-z0-9/+=]{40}`), "[REDACTED AWS SECRET]"},
	{regexp.MustCompile(`(?s)-----BEGIN[A-Z\s]*PRIVATE KEY-----.*?-----END[A-Z\s]*PRIVATE KEY-----`), "[REDACTED PRIVATE KEY]"},
	{regexp.MustCompile(`\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b`), "[REDACTED GITHUB TOKEN]"},
	{regexp.MustCompile(`\bsk-[A-Za-z0-9_-]{20,}\b`), "[REDACTED API KEY]"},
	{regexp.MustCompile(`\bxox[bporas]-[A-Za-z0-9\-]{10,}\b`), "[REDACTED SLACK TOKEN]"},
	{regexp.MustCompile(`\bglpat-[A-Za-z0-9_-]{20,}\b`), "[REDACTED GITLAB TOKEN]"},
	{regexp.MustCompile(`\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b`), "[REDACTED JWT]"},
	{regexp.MustCompile(`(?i)\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b`), "Bearer [REDACTED]"},
	{regexp.MustCompile(`(?i)(?:postgres|mysql|mongodb|redis|amqp)(?:ql)?://[^:\s]+:[^@\s]+@`), "[REDACTED CONNECTION STRING]@"},
	{regexp.MustCompile(`(?i)(?:API_KEY|API_SECRET|SECRET_KEY|SECRET|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|DATABASE_URL|DB_PASSWORD|DB_URL|REDIS_URL|PASSWORD|TOKEN)\s*[=:]\s*\S+`), "[REDACTED CREDENTIAL]"},
}

func InputMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	out := make(map[string]any, len(m))
	for k, v := range m {
		if s, ok := v.(string); ok {
			out[k] = Text(s)
		} else {
			out[k] = v
		}
	}
	return out
}

var homeDir string
var username string

func init() {
	homeDir, _ = os.UserHomeDir()
	if u, err := user.Current(); err == nil {
		username = u.Username
	}
}

func Text(s string) string {
	for _, p := range patterns {
		s = p.re.ReplaceAllString(s, p.replacement)
	}
	if homeDir != "" && username != "" {
		masked := strings.Replace(homeDir, username, "****", 1)
		s = strings.ReplaceAll(s, homeDir, masked)
	}
	return s
}
