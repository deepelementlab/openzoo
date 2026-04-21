CREATE TABLE IF NOT EXISTS task_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    type TEXT NOT NULL,
    tool TEXT,
    content TEXT,
    input JSONB,
    output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id_seq ON task_messages(task_id, seq);
