CREATE TABLE IF NOT EXISTS runtime_usage (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    runtime_id TEXT REFERENCES runtimes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    cache_read_tokens BIGINT DEFAULT 0,
    cache_write_tokens BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(runtime_id, date, provider, model)
);

CREATE INDEX IF NOT EXISTS idx_runtime_usage_runtime ON runtime_usage(runtime_id, date);
