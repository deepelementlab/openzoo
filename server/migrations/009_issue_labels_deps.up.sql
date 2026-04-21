-- Migration 009: Issue labels (standalone) + dependencies
-- The issue_labels join table was created in 002 with different structure.
-- This migration creates issue_labels_standalone and renames the old join table.

-- Rename old join table
ALTER TABLE issue_labels RENAME TO issue_to_label;

-- Create standalone issue_labels with workspace_id
CREATE TABLE IF NOT EXISTS issue_labels (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_issue_labels_workspace ON issue_labels(workspace_id);

-- Recreate issue_to_label with proper references
DROP TABLE IF EXISTS issue_to_label;
CREATE TABLE IF NOT EXISTS issue_to_label (
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_id TEXT NOT NULL REFERENCES issue_labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

-- Issue dependencies
CREATE TABLE IF NOT EXISTS issue_dependencies (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    depends_on_issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('blocks', 'blocked_by', 'related')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_deps_issue ON issue_dependencies(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_deps_depends ON issue_dependencies(depends_on_issue_id);
