package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/openzoo-ai/openzoo/server/internal/connectapi"
	"github.com/openzoo-ai/openzoo/server/internal/database"
	"github.com/openzoo-ai/openzoo/server/internal/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func NewRouter() http.Handler {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}))
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(middleware.Metrics)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		db := database.Pool()
		dbStatus := "up"
		if db != nil {
			if err := db.Ping(nil); err != nil {
				dbStatus = "down"
			}
		} else {
			dbStatus = "down"
		}
		status := "ok"
		code := http.StatusOK
		if dbStatus == "down" {
			status = "unhealthy"
			code = http.StatusServiceUnavailable
		}
		w.WriteHeader(code)
		json.NewEncoder(w).Encode(map[string]string{
			"status":   status,
			"database": dbStatus,
			"ts":       time.Now().UTC().Format(time.RFC3339),
		})
	})

	r.Handle("/metrics", promhttp.Handler())

	db := database.Pool()
	connectapi.RegisterConnectRPC(r, db)

	return r
}
