package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
)

const (
	AuthCookieName  = "openzoo_auth"
	CSRFCookieName  = "openzoo_csrf"
	authCookieMaxAge = 30 * 24 * 60 * 60
)

func SetAuthCookies(w http.ResponseWriter, token string) error {
	secure := isSecureCookie()
	domain := cookieDomain()

	http.SetCookie(w, &http.Cookie{
		Name:     AuthCookieName,
		Value:    token,
		Path:     "/",
		Domain:   domain,
		MaxAge:   authCookieMaxAge,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	csrfToken, err := generateCSRFToken(token)
	if err != nil {
		return err
	}

	http.SetCookie(w, &http.Cookie{
		Name:     CSRFCookieName,
		Value:    csrfToken,
		Path:     "/",
		Domain:   domain,
		MaxAge:   authCookieMaxAge,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		HttpOnly: false,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	return nil
}

func ClearAuthCookies(w http.ResponseWriter) {
	domain := cookieDomain()
	secure := isSecureCookie()

	for _, name := range []string{AuthCookieName, CSRFCookieName} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			Domain:   domain,
			MaxAge:   -1,
			Expires:  time.Unix(0, 0),
			HttpOnly: name == AuthCookieName,
			Secure:   secure,
			SameSite: http.SameSiteStrictMode,
		})
	}
}

func GenerateDaemonToken() (string, error) {
	b := make([]byte, 20)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate daemon token: %w", err)
	}
	return "ozt_" + hex.EncodeToString(b), nil
}

func HashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
