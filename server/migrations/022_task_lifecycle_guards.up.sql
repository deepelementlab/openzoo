CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_task_per_issue
    ON tasks (issue_id)
    WHERE status IN ('queued', 'dispatched');
