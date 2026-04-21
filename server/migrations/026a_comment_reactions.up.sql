CREATE TABLE IF NOT EXISTS comment_reactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'agent')),
    actor_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (comment_id, actor_type, actor_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
