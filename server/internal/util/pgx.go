package util

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
)

type Mention struct {
	Type string
	ID   string
}

var MentionRe = regexp.MustCompile(`\[@([^\]]+)\]\(mention://([^/]+)/([^)]+)\)`)

func (m Mention) IsMentionAll() bool {
	return m.Type == "all"
}

func ParseMentions(content string) []Mention {
	matches := MentionRe.FindAllStringSubmatch(content, -1)
	seen := make(map[string]bool)
	var result []Mention
	for _, m := range matches {
		mention := Mention{Type: m[2], ID: m[3]}
		key := mention.Type + ":" + mention.ID
		if !seen[key] {
			seen[key] = true
			result = append(result, mention)
		}
	}
	return result
}

func HasMentionAll(mentions []Mention) bool {
	for _, m := range mentions {
		if m.IsMentionAll() {
			return true
		}
	}
	return false
}

func ParseUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	_, err := fmt.Sscanf(s,
		"%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
		&u.Bytes[0], &u.Bytes[1], &u.Bytes[2], &u.Bytes[3],
		&u.Bytes[4], &u.Bytes[5], &u.Bytes[6], &u.Bytes[7],
		&u.Bytes[8], &u.Bytes[9], &u.Bytes[10], &u.Bytes[11],
		&u.Bytes[12], &u.Bytes[13], &u.Bytes[14], &u.Bytes[15],
	)
	if err != nil {
		u.Valid = false
	} else {
		u.Valid = true
	}
	return u
}

func UUIDToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		u.Bytes[0:4], u.Bytes[4:6], u.Bytes[6:8], u.Bytes[8:10], u.Bytes[10:16])
}

func TextToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func PtrToText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func StrToText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func TimestampToString(t pgtype.Timestamptz) string {
	if !t.Valid {
		return ""
	}
	return t.Time.Format("2006-01-02T15:04:05Z07:00")
}

func TimestampToPtr(t pgtype.Timestamptz) *string {
	if !t.Valid {
		return nil
	}
	s := t.Time.Format("2006-01-02T15:04:05Z07:00")
	return &s
}

func UUIDToPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := UUIDToString(u)
	return &s
}

func SafeDerefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func ContainsString(slice []string, target string) bool {
	for _, s := range slice {
		if strings.EqualFold(s, target) {
			return true
		}
	}
	return false
}
