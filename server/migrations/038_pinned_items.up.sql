DROP TABLE IF EXISTS pins;
CREATE TABLE pins (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('issue', 'project', 'view', 'cycle')),
    item_id TEXT NOT NULL,
    position FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, item_type, item_id)
);
CREATE INDEX idx_pins_user_ws ON pins(workspace_id, user_id, position);
