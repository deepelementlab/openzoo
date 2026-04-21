CREATE TABLE IF NOT EXISTS daemon_tokens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    daemon_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daemon_tokens_hash ON daemon_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_daemon_tokens_workspace ON daemon_tokens(workspace_id);
