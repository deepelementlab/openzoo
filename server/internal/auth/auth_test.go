package auth

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestGenerateAndValidateToken(t *testing.T) {
	token, err := GenerateToken("user-123", "test@example.com")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ValidateToken(token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != "user-123" {
		t.Fatalf("expected user-123, got %s", claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Fatalf("expected test@example.com, got %s", claims.Email)
	}
	if claims.Issuer != "openzoo" {
		t.Fatalf("expected openzoo issuer, got %s", claims.Issuer)
	}
}

func TestValidateTokenInvalid(t *testing.T) {
	_, err := ValidateToken("invalid.token.string")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestValidateTokenWrongSecret(t *testing.T) {
	token, err := GenerateToken("user-1", "a@b.com")
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	orig := os.Getenv("JWT_SECRET")
	os.Setenv("JWT_SECRET", "wrong-secret-key-1234567890")
	defer os.Setenv("JWT_SECRET", orig)
	_, err = ValidateToken(token)
	if err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestGetJWTSecret(t *testing.T) {
	secret := GetJWTSecret()
	if len(secret) == 0 {
		t.Fatal("expected non-empty secret")
	}
}

func TestCSRFValidationGETPasses(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	if !ValidateCSRF(r) {
		t.Fatal("GET should always pass CSRF")
	}
}

func TestCSRFValidationOPTIONSPasses(t *testing.T) {
	r := httptest.NewRequest(http.MethodOptions, "/", nil)
	if !ValidateCSRF(r) {
		t.Fatal("OPTIONS should always pass CSRF")
	}
}

func TestCSRFValidationPOSTFailsWithoutHeader(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	if ValidateCSRF(r) {
		t.Fatal("POST without CSRF header should fail")
	}
}

func TestCSRFValidationRoundtrip(t *testing.T) {
	authToken := "test-auth-token-value"
	csrfToken, err := generateCSRFToken(authToken)
	if err != nil {
		t.Fatalf("generateCSRFToken failed: %v", err)
	}
	if !strings.Contains(csrfToken, ".") {
		t.Fatal("expected dot-separated CSRF token")
	}

	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set(CSRFHeader, csrfToken)
	r.AddCookie(&http.Cookie{Name: AuthCookieName, Value: authToken})

	if !ValidateCSRF(r) {
		t.Fatal("valid CSRF token should pass")
	}
}

func TestCSRFValidationFailsWithWrongAuthCookie(t *testing.T) {
	csrfToken, _ := generateCSRFToken("correct-token")
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set(CSRFHeader, csrfToken)
	r.AddCookie(&http.Cookie{Name: AuthCookieName, Value: "wrong-token"})

	if ValidateCSRF(r) {
		t.Fatal("wrong auth cookie should fail CSRF")
	}
}

func TestCSRFValidationFailsWithMalformedToken(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	r.Header.Set(CSRFHeader, "not-valid-hex")
	r.AddCookie(&http.Cookie{Name: AuthCookieName, Value: "token"})

	if ValidateCSRF(r) {
		t.Fatal("malformed CSRF token should fail")
	}
}

func TestSetAuthCookies(t *testing.T) {
	w := httptest.NewRecorder()
	err := SetAuthCookies(w, "test-jwt-token")
	if err != nil {
		t.Fatalf("SetAuthCookies failed: %v", err)
	}

	cookies := w.Result().Cookies()
	found := make(map[string]bool)
	for _, c := range cookies {
		found[c.Name] = true
	}
	if !found[AuthCookieName] {
		t.Fatal("expected auth cookie to be set")
	}
	if !found[CSRFCookieName] {
		t.Fatal("expected CSRF cookie to be set")
	}
}

func TestClearAuthCookies(t *testing.T) {
	w := httptest.NewRecorder()
	ClearAuthCookies(w)

	cookies := w.Result().Cookies()
	for _, c := range cookies {
		if c.MaxAge != -1 {
			t.Fatalf("expected MaxAge=-1 for cookie %s, got %d", c.Name, c.MaxAge)
		}
	}
}

func TestGenerateDaemonToken(t *testing.T) {
	token, err := GenerateDaemonToken()
	if err != nil {
		t.Fatalf("GenerateDaemonToken failed: %v", err)
	}
	if !strings.HasPrefix(token, "ozt_") {
		t.Fatalf("expected ozt_ prefix, got %s", token)
	}
}

func TestHashToken(t *testing.T) {
	hash := HashToken("test-token")
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if len(hash) != 64 {
		t.Fatalf("expected 64-char hex hash, got %d chars", len(hash))
	}
	hash2 := HashToken("test-token")
	if hash != hash2 {
		t.Fatal("same input should produce same hash")
	}
	hash3 := HashToken("different-token")
	if hash == hash3 {
		t.Fatal("different inputs should produce different hashes")
	}
}
