ALTER TABLE runtimes ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);
UPDATE runtimes ar SET owner_id = (
    SELECT m.user_id FROM members m
    WHERE m.workspace_id = ar.workspace_id AND m.role = 'owner'
    LIMIT 1
) WHERE owner_id IS NULL;
