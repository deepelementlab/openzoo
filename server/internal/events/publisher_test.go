package events

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPublisherPublish_SendsExpectedRequest(t *testing.T) {
	var got struct {
		Channel string                 `json:"channel"`
		Data    map[string]interface{} `json:"data"`
	}
	var gotAPIKey string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAPIKey = r.Header.Get("X-API-Key")
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatalf("decode: %v", err)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	p := &Publisher{
		addr:   srv.URL,
		apiKey: "k-test",
		client: srv.Client(),
	}
	err := p.Publish(context.Background(), "ws-1", "issue:created", map[string]string{"id": "i-1"})
	if err != nil {
		t.Fatalf("publish: %v", err)
	}

	if gotAPIKey != "k-test" {
		t.Fatalf("expected X-API-Key k-test, got %q", gotAPIKey)
	}
	if got.Channel != "workspace:ws-1" {
		t.Fatalf("expected channel workspace:ws-1, got %q", got.Channel)
	}
	if got.Data["type"] != "issue:created" {
		t.Fatalf("expected type issue:created, got %v", got.Data["type"])
	}
	if got.Data["workspace_id"] != "ws-1" {
		t.Fatalf("expected workspace_id ws-1, got %v", got.Data["workspace_id"])
	}
	if got.Data["payload"] == nil {
		t.Fatalf("expected payload to be present")
	}
}

func TestPublisherPublish_Non2xxIsError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	p := &Publisher{
		addr:   srv.URL,
		apiKey: "bad",
		client: srv.Client(),
	}
	if err := p.Publish(context.Background(), "ws-1", "t", nil); err == nil {
		t.Fatal("expected error on non-2xx response")
	}
}

