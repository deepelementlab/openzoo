ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('planned', 'in_progress', 'paused', 'completed', 'cancelled', 'active', 'archived'));

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm not available, skipping trigram indexes';
END
$$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_issues_title_trgm ON issues USING gin (title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_issues_description_trgm ON issues USING gin (COALESCE(description, '') gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skipping trigram indexes on issues';
END
$$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_content_trgm ON comments USING gin (content gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skipping trigram index on comments';
END
$$;

DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'skipping trigram index on projects';
END
$$;

CREATE INDEX IF NOT EXISTS idx_tasks_pending ON tasks(agent_id, priority DESC, created_at ASC) WHERE status IN ('queued', 'dispatched');

CREATE INDEX IF NOT EXISTS idx_task_messages_task_seq ON task_messages(task_id, seq);

CREATE INDEX IF NOT EXISTS idx_issue_subscribers_user ON issue_subscribers(user_type, user_id);
