CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_task_queue_issue_id
    ON tasks (issue_id);
