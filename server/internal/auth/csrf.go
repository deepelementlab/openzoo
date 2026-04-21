package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
)

const CSRFHeader = "X-CSRF-Token"

func generateCSRFToken(authToken string) (string, error) {
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	nonceHex := hex.EncodeToString(nonce)
	mac := hmac.New(sha256.New, []byte(authToken))
	mac.Write(nonce)
	sig := hex.EncodeToString(mac.Sum(nil))
	return nonceHex + "." + sig, nil
}

func ValidateCSRF(r *http.Request) bool {
	switch r.Method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return true
	}

	csrfHeader := r.Header.Get(CSRFHeader)
	if csrfHeader == "" {
		return false
	}

	authCookie, err := r.Cookie(AuthCookieName)
	if err != nil || authCookie.Value == "" {
		return false
	}

	parts := strings.SplitN(csrfHeader, ".", 2)
	if len(parts) != 2 {
		return false
	}

	nonce, err := hex.DecodeString(parts[0])
	if err != nil {
		return false
	}

	expectedSig, err := hex.DecodeString(parts[1])
	if err != nil {
		return false
	}

	mac := hmac.New(sha256.New, []byte(authCookie.Value))
	mac.Write(nonce)
	return hmac.Equal(mac.Sum(nil), expectedSig)
}

func isSecureCookie() bool {
	env := os.Getenv("APP_ENV")
	return env == "production" || env == "staging"
}

func cookieDomain() string {
	return strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))
}
