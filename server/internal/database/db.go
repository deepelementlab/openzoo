package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool   *pgxpool.Pool
	poolMu sync.Once
)

func Pool() *pgxpool.Pool {
	poolMu.Do(func() {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			dsn = "postgres://openzoo:openzoo@localhost:5432/openzoo?sslmode=disable"
		}
		cfg, err := pgxpool.ParseConfig(dsn)
		if err != nil {
			log.Fatalf("parse db config: %v", err)
		}
		cfg.MaxConns = 25
		p, err := pgxpool.NewWithConfig(context.Background(), cfg)
		if err != nil {
			log.Fatalf("connect db: %v", err)
		}
		if err := p.Ping(context.Background()); err != nil {
			log.Fatalf("ping db: %v", err)
		}
		pool = p
		log.Println("database pool initialized")
	})
	return pool
}

func HealthCheck(ctx context.Context) error {
	if pool == nil {
		return fmt.Errorf("database not initialized")
	}
	return pool.Ping(ctx)
}
