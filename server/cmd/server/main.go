package main

import (
	"log"
	"net/http"
	"os"

	"github.com/openzoo-ai/openzoo/server/internal/database"
	"github.com/openzoo-ai/openzoo/server/internal/eventlisteners"
	"github.com/openzoo-ai/openzoo/server/internal/events"
)

func main() {
	db := database.Pool()

	eventlisteners.Init(db, events.GetPublisher())

	addr := os.Getenv("PORT")
	if addr == "" {
		addr = "8080"
	}

	handler := NewRouter()
	log.Printf("openzoo server listening on :%s", addr)
	if err := http.ListenAndServe(":"+addr, handler); err != nil {
		log.Fatal(err)
	}
}
