package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests",
	}, []string{"method", "path", "status"})

	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "HTTP request duration in seconds",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "path"})

	httpRequestsInFlight = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "http_requests_in_flight",
		Help: "Number of HTTP requests currently in flight",
	}, []string{"method"})
)

func Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := normalizePath(r.URL.Path)
		method := r.Method

		httpRequestsInFlight.WithLabelValues(method).Inc()
		defer httpRequestsInFlight.WithLabelValues(method).Dec()

		start := time.Now()
		ww := &responseWriter{ResponseWriter: w, statusCode: 200}
		next.ServeHTTP(ww, r)
		duration := time.Since(start).Seconds()

		status := strconv.Itoa(ww.statusCode)
		httpRequestsTotal.WithLabelValues(method, path, status).Inc()
		httpRequestDuration.WithLabelValues(method, path).Observe(duration)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func normalizePath(path string) string {
	if len(path) > 50 {
		path = path[:50]
	}
	return path
}
