CREATE TABLE IF NOT EXISTS daemon_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    token_hash TEXT NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    daemon_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daemon_tokens_hash ON daemon_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_daemon_tokens_workspace_daemon ON daemon_tokens(workspace_id, daemon_id);
