-- OpenZoo Database Schema
-- Migration 002: Labels, Cycles, Views

-- Labels
CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, name)
);

CREATE INDEX IF NOT EXISTS idx_labels_workspace ON labels(workspace_id);

-- Issue Labels (many-to-many)
CREATE TABLE IF NOT EXISTS issue_labels (
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (issue_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_labels_issue ON issue_labels(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_label ON issue_labels(label_id);

-- Cycles
CREATE TABLE IF NOT EXISTS cycles (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    number INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','current','completed','canceled')),
    auto_create_next BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, number)
);

CREATE INDEX IF NOT EXISTS idx_cycles_workspace ON cycles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cycles_status ON cycles(workspace_id, status);

-- Cycle Issues
CREATE TABLE IF NOT EXISTS cycle_issues (
    id TEXT PRIMARY KEY,
    cycle_id TEXT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cycle_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_cycle_issues_cycle ON cycle_issues(cycle_id);
CREATE INDEX IF NOT EXISTS idx_cycle_issues_issue ON cycle_issues(issue_id);

-- Views (custom saved filters)
CREATE TABLE IF NOT EXISTS views (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    filters JSONB NOT NULL DEFAULT '{}',
    sort_order JSONB DEFAULT '[]',
    is_shared BOOLEAN NOT NULL DEFAULT false,
    creator_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_views_workspace ON views(workspace_id);
CREATE INDEX IF NOT EXISTS idx_views_creator ON views(creator_id);
