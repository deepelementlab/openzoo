DROP INDEX IF EXISTS idx_one_pending_task_per_issue;
CREATE UNIQUE INDEX idx_one_pending_task_per_issue_agent
    ON tasks (issue_id, agent_id)
    WHERE status IN ('queued', 'dispatched');
