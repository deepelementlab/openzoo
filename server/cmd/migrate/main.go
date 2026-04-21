package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/openzoo-ai/openzoo/server/internal/database"
)

func main() {
	direction := "up"
	if len(os.Args) > 1 {
		direction = os.Args[1]
	}

	db := database.Pool()
	ctx := context.Background()

	migrationsDir := findMigrationsDir()
	if migrationsDir == "" {
		log.Fatal("migrations directory not found")
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("read migrations: %v", err)
	}

	suffix := ".up.sql"
	if direction == "down" {
		suffix = ".down.sql"
	}

	var migrationFiles []string
	for _, f := range files {
		if strings.HasSuffix(f.Name(), suffix) {
			migrationFiles = append(migrationFiles, f.Name())
		}
	}
	sort.Strings(migrationFiles)

	if direction == "down" {
		sort.Sort(sort.Reverse(sort.StringSlice(migrationFiles)))
	}

	for _, name := range migrationFiles {
		path := filepath.Join(migrationsDir, name)
		content, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("read %s: %v", name, err)
		}
		log.Printf("applying migration: %s", name)
		_, err = db.Exec(ctx, string(content))
		if err != nil {
			log.Fatalf("apply %s: %v", name, err)
		}
		fmt.Printf("✓ %s\n", name)
	}
	log.Printf("migrations complete (%s, %d files)", direction, len(migrationFiles))
}

func findMigrationsDir() string {
	candidates := []string{"migrations", "server/migrations", "../migrations"}
	for _, c := range candidates {
		if info, err := os.Stat(c); err == nil && info.IsDir() {
			return c
		}
	}
	return ""
}
