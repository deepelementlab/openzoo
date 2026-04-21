CREATE TABLE IF NOT EXISTS issue_subscribers (
    issue_id   TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_type  TEXT NOT NULL CHECK (user_type IN ('user', 'agent')),
    user_id    TEXT NOT NULL,
    reason     TEXT NOT NULL CHECK (reason IN ('creator', 'assignee', 'commenter', 'mentioned', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (issue_id, user_type, user_id)
);
CREATE INDEX IF NOT EXISTS idx_issue_subscribers_user ON issue_subscribers(user_type, user_id);
