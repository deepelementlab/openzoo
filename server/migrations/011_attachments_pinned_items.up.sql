CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    uploader_type TEXT NOT NULL CHECK (uploader_type IN ('member', 'agent')),
    uploader_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachment_issue ON attachments(issue_id) WHERE issue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attachment_comment ON attachments(comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attachment_workspace ON attachments(workspace_id);

CREATE TABLE IF NOT EXISTS pinned_items (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('issue', 'project')),
    item_id TEXT NOT NULL,
    position DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_items_user ON pinned_items(workspace_id, user_id, position);
