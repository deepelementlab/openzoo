CREATE TABLE IF NOT EXISTS issue_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent')),
    actor_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (issue_id, actor_type, actor_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_issue_reactions_issue_id ON issue_reactions(issue_id);
