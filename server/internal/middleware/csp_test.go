package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestContentSecurityPolicy(t *testing.T) {
	handler := ContentSecurityPolicy(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	csp := rec.Header().Get("Content-Security-Policy")
	if csp == "" {
		t.Fatal("Content-Security-Policy header not set")
	}

	required := []string{
		"default-src 'self'",
		"script-src 'self'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' https: data:",
		"connect-src 'self' wss:",
		"frame-ancestors 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	}

	for _, directive := range required {
		if !strings.Contains(csp, directive) {
			t.Errorf("CSP missing directive: %s", directive)
		}
	}
}
