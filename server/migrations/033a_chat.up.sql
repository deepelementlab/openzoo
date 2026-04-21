CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    session_id TEXT,
    work_dir TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_workspace ON chat_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_creator ON chat_sessions(creator_id, workspace_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    task_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(chat_session_id, created_at);

ALTER TABLE tasks ALTER COLUMN issue_id DROP NOT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS chat_session_id TEXT REFERENCES chat_sessions(id) ON DELETE SET NULL;
