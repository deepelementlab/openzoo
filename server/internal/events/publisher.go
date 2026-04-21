package events

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
)

// Publisher sends events to Centrifugo for real-time delivery.
type Publisher struct {
	addr   string
	apiKey string
	client *http.Client
}

var (
	instance *Publisher
	once     sync.Once
)

func GetPublisher() *Publisher {
	once.Do(func() {
		addr := os.Getenv("CENTRIFUGO_API_URL")
		if addr == "" {
			addr = "http://localhost:8000/api/publish"
		}
		key := os.Getenv("CENTRIFUGO_API_KEY")
		if key == "" {
			key = "openzoo-dev-key"
		}
		instance = &Publisher{
			addr:   addr,
			apiKey: key,
			client: &http.Client{},
		}
	})
	return instance
}

// Publish sends an event to a workspace channel.
func (p *Publisher) Publish(ctx context.Context, workspaceID, eventType string, payload interface{}) error {
	channel := "workspace:" + workspaceID
	data := map[string]interface{}{
		"type":         eventType,
		"workspace_id": workspaceID,
		"payload":      payload,
	}
	body, err := json.Marshal(map[string]interface{}{
		"channel": channel,
		"data":    data,
	})
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.addr, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", p.apiKey)
	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("publish event: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("centrifugo returned %d", resp.StatusCode)
	}
	log.Printf("event published: %s -> %s", eventType, channel)
	return nil
}

// PublishBatch publishes multiple events to the same workspace.
func (p *Publisher) PublishBatch(ctx context.Context, workspaceID string, events []struct {
	Type    string
	Payload interface{}
}) error {
	for _, e := range events {
		if err := p.Publish(ctx, workspaceID, e.Type, e.Payload); err != nil {
			return err
		}
	}
	return nil
}

// PublishWorkspace is a compatibility shim for older callers.
func (p *Publisher) PublishWorkspace(ctx context.Context, workspaceID, eventType string, payload interface{}) error {
	return p.Publish(ctx, workspaceID, eventType, payload)
}

// PublishWorkspaceEvent is a compatibility shim for legacy callers.
func (p *Publisher) PublishWorkspaceEvent(workspaceID, eventType string, payload interface{}) error {
	return p.Publish(context.Background(), workspaceID, eventType, payload)
}
