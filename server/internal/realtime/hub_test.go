package realtime

import (
	"encoding/json"
	"testing"
	"time"
)

func TestNewHub(t *testing.T) {
	hub := NewHub()
	if hub == nil {
		t.Fatal("expected non-nil hub")
	}
	if hub.rooms == nil {
		t.Fatal("expected initialized rooms map")
	}
}

func TestHubRegisterAndUnregister(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	time.Sleep(10 * time.Millisecond)

	client := &Client{
		hub:         hub,
		send:        make(chan []byte, 256),
		userID:      "user-1",
		workspaceID: "ws-1",
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	if hub.ClientCount() != 1 {
		t.Fatalf("expected 1 client, got %d", hub.ClientCount())
	}
	if hub.RoomCount() != 1 {
		t.Fatalf("expected 1 room, got %d", hub.RoomCount())
	}

	online := hub.OnlineUserIDs("ws-1")
	if len(online) != 1 || online[0] != "user-1" {
		t.Fatalf("expected [user-1], got %v", online)
	}

	hub.unregister <- client
	time.Sleep(50 * time.Millisecond)

	if hub.ClientCount() != 0 {
		t.Fatalf("expected 0 clients, got %d", hub.ClientCount())
	}
}

func TestHubBroadcastToWorkspace(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	time.Sleep(10 * time.Millisecond)

	received := make(chan []byte, 4)
	client := &Client{
		hub:         hub,
		send:        received,
		userID:      "user-1",
		workspaceID: "ws-1",
	}
	hub.register <- client
	time.Sleep(50 * time.Millisecond)

	for len(received) > 0 {
		<-received
	}

	msg, _ := json.Marshal(map[string]string{"type": "test"})
	hub.BroadcastToWorkspace("ws-1", msg)

	select {
	case got := <-received:
		var m map[string]string
		if err := json.Unmarshal(got, &m); err != nil {
			t.Fatalf("invalid json: %v", err)
		}
		if m["type"] != "test" {
			t.Fatalf("expected test, got %s", m["type"])
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for broadcast")
	}
}

func TestHubBroadcastToEmptyWorkspace(t *testing.T) {
	hub := NewHub()
	msg, _ := json.Marshal(map[string]string{"type": "test"})
	hub.BroadcastToWorkspace("nonexistent", msg)
}

func TestHubOnlineUserIDsEmpty(t *testing.T) {
	hub := NewHub()
	ids := hub.OnlineUserIDs("nonexistent")
	if len(ids) != 0 {
		t.Fatalf("expected empty, got %v", ids)
	}
}

func TestHubMultipleClientsSameUser(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	time.Sleep(10 * time.Millisecond)

	c1 := &Client{hub: hub, send: make(chan []byte, 256), userID: "user-1", workspaceID: "ws-1"}
	c2 := &Client{hub: hub, send: make(chan []byte, 256), userID: "user-1", workspaceID: "ws-1"}
	hub.register <- c1
	hub.register <- c2
	time.Sleep(50 * time.Millisecond)

	if hub.ClientCount() != 2 {
		t.Fatalf("expected 2 clients, got %d", hub.ClientCount())
	}
	online := hub.OnlineUserIDs("ws-1")
	if len(online) != 1 {
		t.Fatalf("expected 1 unique user, got %d", len(online))
	}

	hub.unregister <- c1
	time.Sleep(50 * time.Millisecond)
	if hub.ClientCount() != 1 {
		t.Fatalf("expected 1 client after unregister, got %d", hub.ClientCount())
	}
}
