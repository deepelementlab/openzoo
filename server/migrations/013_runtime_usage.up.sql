DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'runtime_usage') THEN
        CREATE TABLE runtime_usage (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            runtime_id TEXT NOT NULL REFERENCES runtimes(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL DEFAULT '',
            input_tokens BIGINT NOT NULL DEFAULT 0,
            output_tokens BIGINT NOT NULL DEFAULT 0,
            cache_read_tokens BIGINT NOT NULL DEFAULT 0,
            cache_write_tokens BIGINT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (runtime_id, date, provider, model)
        );
        CREATE INDEX idx_runtime_usage_runtime_date ON runtime_usage(runtime_id, date DESC);
    END IF;
END $$;
