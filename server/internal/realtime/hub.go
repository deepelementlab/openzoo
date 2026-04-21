package realtime

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"sync/atomic"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/openzoo-ai/openzoo/server/internal/auth"
)

type MembershipChecker interface {
	IsMember(ctx context.Context, userID, workspaceID string) bool
}

type PATResolver interface {
	ResolveToken(ctx context.Context, token string) (userID string, ok bool)
}

var allowedWSOrigins atomic.Value

func init() {
	allowedWSOrigins.Store(loadAllowedOrigins())
}

func loadAllowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if raw == "" {
		raw = strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	}
	if raw == "" {
		raw = strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN"))
	}
	if raw == "" {
		return []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:5174",
		}
	}
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}

func SetAllowedOrigins(origins []string) {
	allowedWSOrigins.Store(origins)
}

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	origins := allowedWSOrigins.Load().([]string)
	for _, allowed := range origins {
		if origin == allowed {
			return true
		}
	}
	slog.Warn("ws: rejected origin", "origin", origin)
	return false
}

var upgrader = websocket.Upgrader{
	CheckOrigin: checkOrigin,
}

type Client struct {
	hub         *Hub
	conn        *websocket.Conn
	send        chan []byte
	userID      string
	workspaceID string
}

type Hub struct {
	rooms      map[string]map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			room := client.workspaceID
			if h.rooms[room] == nil {
				h.rooms[room] = make(map[*Client]bool)
			}
			wasOnline := false
			for c := range h.rooms[room] {
				if c.userID == client.userID {
					wasOnline = true
					break
				}
			}
			h.rooms[room][client] = true
			total := 0
			for _, r := range h.rooms {
				total += len(r)
			}
			h.mu.Unlock()
			slog.Info("ws client connected", "workspace_id", room, "total_clients", total)
			if !wasOnline {
				h.broadcastPresence(room, client.userID, true)
			}

		case client := <-h.unregister:
			h.mu.Lock()
			room := client.workspaceID
			if clients, ok := h.rooms[room]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.rooms, room)
					}
				}
			}
			stillOnline := false
			if clients, ok := h.rooms[room]; ok {
				for c := range clients {
					if c.userID == client.userID {
						stillOnline = true
						break
					}
				}
			}
			total := 0
			for _, r := range h.rooms {
				total += len(r)
			}
			h.mu.Unlock()
			slog.Info("ws client disconnected", "workspace_id", room, "total_clients", total)
			if !stillOnline {
				h.broadcastPresence(room, client.userID, false)
			}

		case message := <-h.broadcast:
			h.mu.RLock()
			var slow []*Client
			for _, clients := range h.rooms {
				for client := range clients {
					select {
					case client.send <- message:
					default:
						slow = append(slow, client)
					}
				}
			}
			h.mu.RUnlock()
			if len(slow) > 0 {
				h.mu.Lock()
				for _, client := range slow {
					room := client.workspaceID
					if clients, ok := h.rooms[room]; ok {
						if _, exists := clients[client]; exists {
							delete(clients, client)
							close(client.send)
							if len(clients) == 0 {
								delete(h.rooms, room)
							}
						}
					}
				}
				h.mu.Unlock()
			}
		}
	}
}

func (h *Hub) BroadcastToWorkspace(workspaceID string, message []byte) {
	h.mu.RLock()
	clients := h.rooms[workspaceID]
	var slow []*Client
	for client := range clients {
		select {
		case client.send <- message:
		default:
			slow = append(slow, client)
		}
	}
	h.mu.RUnlock()
	if len(slow) > 0 {
		h.mu.Lock()
		for _, client := range slow {
			if room, ok := h.rooms[workspaceID]; ok {
				if _, exists := room[client]; exists {
					delete(room, client)
					close(client.send)
					if len(room) == 0 {
						delete(h.rooms, workspaceID)
					}
				}
			}
		}
		h.mu.Unlock()
	}
}

func (h *Hub) SendToUser(userID string, message []byte, excludeWorkspace ...string) {
	exclude := ""
	if len(excludeWorkspace) > 0 {
		exclude = excludeWorkspace[0]
	}
	h.mu.RLock()
	type target struct {
		client      *Client
		workspaceID string
	}
	var targets []target
	for wsID, clients := range h.rooms {
		if wsID == exclude {
			continue
		}
		for client := range clients {
			if client.userID == userID {
				targets = append(targets, target{client, wsID})
			}
		}
	}
	h.mu.RUnlock()
	var slow []target
	for _, t := range targets {
		select {
		case t.client.send <- message:
		default:
			slow = append(slow, t)
		}
	}
	if len(slow) > 0 {
		h.mu.Lock()
		for _, t := range slow {
			if room, ok := h.rooms[t.workspaceID]; ok {
				if _, exists := room[t.client]; exists {
					delete(room, t.client)
					close(t.client.send)
					if len(room) == 0 {
						delete(h.rooms, t.workspaceID)
					}
				}
			}
		}
		h.mu.Unlock()
	}
}

func (h *Hub) Broadcast(message []byte) {
	h.broadcast <- message
}

func (h *Hub) OnlineUserIDs(workspaceID string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	seen := make(map[string]bool)
	if clients, ok := h.rooms[workspaceID]; ok {
		for c := range clients {
			seen[c.userID] = true
		}
	}
	ids := make([]string, 0, len(seen))
	for id := range seen {
		ids = append(ids, id)
	}
	return ids
}

func (h *Hub) RoomCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.rooms)
}

func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	total := 0
	for _, r := range h.rooms {
		total += len(r)
	}
	return total
}

func (h *Hub) broadcastPresence(workspaceID, userID string, online bool) {
	eventType := "member:offline"
	if online {
		eventType = "member:online"
	}
	data, err := json.Marshal(map[string]any{
		"type":    eventType,
		"payload": map[string]any{"user_id": userID},
	})
	if err != nil {
		return
	}
	h.BroadcastToWorkspace(workspaceID, data)
}

func HandleWebSocket(hub *Hub, mc MembershipChecker, pr PATResolver, w http.ResponseWriter, r *http.Request) {
	workspaceID := r.URL.Query().Get("workspace_id")
	if workspaceID == "" {
		http.Error(w, `{"error":"workspace_id required"}`, http.StatusUnauthorized)
		return
	}
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		if cookie, err := r.Cookie(auth.AuthCookieName); err == nil && cookie.Value != "" {
			tokenStr = cookie.Value
		}
	}
	if tokenStr == "" {
		http.Error(w, `{"error":"authentication required"}`, http.StatusUnauthorized)
		return
	}
	var userID string
	if strings.HasPrefix(tokenStr, "ozt_") {
		if pr == nil {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		uid, ok := pr.ResolveToken(r.Context(), tokenStr)
		if !ok {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		userID = uid
	} else {
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return auth.GetJWTSecret(), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
			return
		}
		uid, ok := claims["sub"].(string)
		if !ok || strings.TrimSpace(uid) == "" {
			http.Error(w, `{"error":"invalid claims"}`, http.StatusUnauthorized)
			return
		}
		userID = uid
	}
	if !mc.IsMember(r.Context(), userID, workspaceID) {
		http.Error(w, `{"error":"not a member of this workspace"}`, http.StatusForbidden)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		return
	}
	client := &Client{
		hub:         hub,
		conn:        conn,
		send:        make(chan []byte, 256),
		userID:      userID,
		workspaceID: workspaceID,
	}
	hub.register <- client
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				slog.Debug("websocket read error", "error", err, "user_id", c.userID, "workspace_id", c.workspaceID)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			slog.Warn("websocket write error", "error", err)
			return
		}
	}
}
