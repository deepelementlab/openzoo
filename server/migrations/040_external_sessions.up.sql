ALTER TABLE agents ADD COLUMN IF NOT EXISTS session_source TEXT DEFAULT 'spawned'
  CHECK (session_source IN ('spawned', 'external_discovered', 'external_adopted'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS external_session_id TEXT DEFAULT '';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS external_pid INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS external_cwd TEXT DEFAULT '';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS external_metadata JSONB DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_discovered_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS external_sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    pid INTEGER NOT NULL,
    process_cwd TEXT DEFAULT '',
    claude_version TEXT DEFAULT '',
    session_file_path TEXT DEFAULT '',
    status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'monitoring', 'adopted', 'lost')),
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_external_sessions_workspace ON external_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_external_sessions_status ON external_sessions(status);
CREATE INDEX IF NOT EXISTS idx_external_sessions_pid ON external_sessions(pid);
