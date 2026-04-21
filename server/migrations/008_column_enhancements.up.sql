ALTER TABLE agents ALTER COLUMN max_concurrent_tasks SET DEFAULT 6;

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS issue_counter INT NOT NULL DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS repos JSONB NOT NULL DEFAULT '[]';

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_dir TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS trigger_comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS chat_session_id TEXT REFERENCES chat_sessions(id) ON DELETE SET NULL;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS acceptance_criteria JSONB NOT NULL DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS context_refs JSONB NOT NULL DEFAULT '[]';

ALTER TABLE issue_subscribers ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'member' CHECK (user_type IN ('member', 'agent'));
ALTER TABLE issue_subscribers ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT 'manual' CHECK (reason IN ('creator', 'assignee', 'commenter', 'mentioned', 'manual'));

ALTER TABLE reactions ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE issue_reactions ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE pats ADD COLUMN IF NOT EXISTS revoked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT '';
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS work_dir TEXT DEFAULT '';

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS task_id TEXT;

ALTER TABLE files ADD COLUMN IF NOT EXISTS uploader_type TEXT NOT NULL DEFAULT 'member' CHECK (uploader_type IN ('member', 'agent'));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent', 'high', 'medium', 'low', 'none'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_type TEXT CHECK (lead_type IN ('member', 'agent'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_id TEXT;

ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS actor_type TEXT;
ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS actor_id TEXT;
ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';
ALTER TABLE inbox_items ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('action_required', 'attention', 'info'));

ALTER TABLE activities ADD COLUMN IF NOT EXISTS actor_type TEXT CHECK (actor_type IN ('member', 'agent', 'system'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS actor_id TEXT;

ALTER TABLE agents ALTER COLUMN visibility SET DEFAULT 'private';

ALTER TABLE tasks ALTER COLUMN issue_id DROP NOT NULL;
