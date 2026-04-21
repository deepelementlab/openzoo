ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS issue_prefix TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS issue_counter INT NOT NULL DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS number INT NOT NULL DEFAULT 0;

UPDATE workspaces SET issue_prefix = UPPER(
    LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3)
);
UPDATE workspaces SET issue_prefix = 'OZ' WHERE issue_prefix = '';

WITH numbered AS (
    SELECT id, workspace_id,
           ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY created_at ASC) AS rn
    FROM issues
)
UPDATE issues SET number = numbered.rn FROM numbered WHERE issues.id = numbered.id;

UPDATE workspaces SET issue_counter = COALESCE(
    (SELECT MAX(number) FROM issues WHERE issues.workspace_id = workspaces.id), 0
);

ALTER TABLE issues ADD CONSTRAINT uq_issue_workspace_number UNIQUE (workspace_id, number);
CREATE INDEX IF NOT EXISTS idx_issue_workspace_number ON issues(workspace_id, number);
