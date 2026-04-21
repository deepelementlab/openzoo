DROP INDEX IF EXISTS idx_workspace_repos_id;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS last_synced;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS status;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS provider;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS branch;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS name;
ALTER TABLE workspace_repos DROP COLUMN IF EXISTS id;
