ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS id TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT 'main';
ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT '';
ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','syncing','error'));
ALTER TABLE workspace_repos ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_repos_id ON workspace_repos(id);
