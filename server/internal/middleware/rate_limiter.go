package middleware

import (
	"net/http"
	"sync"
	"time"
)

func rlWriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
}

type RateLimiter struct {
	clients map[string]*clientLimit
	mu      sync.RWMutex
	limit   int
	window  time.Duration
}

type clientLimit struct {
	count     int
	lastReset time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		clients: make(map[string]*clientLimit),
		limit:   limit,
		window:  window,
	}
}

func (rl *RateLimiter) Cleanup() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			for ip, cl := range rl.clients {
				if time.Since(cl.lastReset) > rl.window*2 {
					delete(rl.clients, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		rl.mu.Lock()
		cl, exists := rl.clients[ip]
		if !exists || time.Since(cl.lastReset) > rl.window {
			rl.clients[ip] = &clientLimit{count: 1, lastReset: time.Now()}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}
		if cl.count >= rl.limit {
			rl.mu.Unlock()
			rlWriteJSON(w, 429, map[string]string{"error": "rate limit exceeded"})
			return
		}
		cl.count++
		rl.mu.Unlock()
		next.ServeHTTP(w, r)
	})
}
