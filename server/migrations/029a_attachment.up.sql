CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
    comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size BIGINT NOT NULL DEFAULT 0,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_issue ON files(issue_id);
