ALTER TABLE comments ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
UPDATE comments SET workspace_id = issues.workspace_id
FROM issues WHERE comments.issue_id = issues.id;
ALTER TABLE comments ALTER COLUMN workspace_id SET NOT NULL;
