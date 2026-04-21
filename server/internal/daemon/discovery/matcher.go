package discovery

import (
	"path/filepath"
	"strings"
	"time"
)

type MatchedSession struct {
	Process    ProcessInfo
	Session    SessionInfo
	Confidence float64
}

func MatchProcessesWithSessions(processes []ProcessInfo, sessions []SessionInfo) []MatchedSession {
	result := make([]MatchedSession, 0)

	recentSessions := make([]SessionInfo, 0, len(sessions))
	threshold := 24 * time.Hour
	for _, s := range sessions {
		if s.IsActive || time.Since(s.LastModified) < threshold {
			recentSessions = append(recentSessions, s)
		}
	}

	for _, proc := range processes {
		bestMatch := findBestMatch(proc, recentSessions)
		if bestMatch != nil {
			result = append(result, *bestMatch)
		}
	}

	for _, sess := range recentSessions {
		alreadyMatched := false
		for _, m := range result {
			if m.Session.SessionID == sess.SessionID {
				alreadyMatched = true
				break
			}
		}
		if !alreadyMatched {
			confidence := 0.2
			if sess.IsActive {
				confidence = 0.5
			}
			result = append(result, MatchedSession{
				Process: ProcessInfo{
					PID:  0,
					Name: "claude",
					Cwd:  sess.ProjectPath,
				},
				Session:    sess,
				Confidence: confidence,
			})
		}
	}

	return result
}

func findBestMatch(proc ProcessInfo, sessions []SessionInfo) *MatchedSession {
	var best *MatchedSession
	bestConfidence := 0.0

	if proc.SessionID != "" {
		for _, sess := range sessions {
			if sess.SessionID == proc.SessionID {
				return &MatchedSession{
					Process:    proc,
					Session:    sess,
					Confidence: 1.0,
				}
			}
		}
	}

	for _, sess := range sessions {
		confidence := 0.0

		if proc.Cwd != "" && sess.ProjectPath != "" {
			procCwd := filepath.Clean(proc.Cwd)
			projPath := filepath.Clean(sess.ProjectPath)

			if procCwd == projPath {
				confidence += 0.7
			} else if strings.HasPrefix(procCwd, projPath) {
				confidence += 0.5
			} else if strings.HasPrefix(projPath, procCwd) {
				confidence += 0.4
			}
		}

		if proc.CmdLine != "" {
			if strings.Contains(proc.CmdLine, sess.SessionID) {
				confidence += 0.3
			}
		}

		if sess.IsActive {
			confidence += 0.1
		}

		if confidence > bestConfidence {
			bestConfidence = confidence
			best = &MatchedSession{
				Process:    proc,
				Session:    sess,
				Confidence: confidence,
			}
		}
	}

	if bestConfidence >= 0.4 {
		return best
	}
	return nil
}
