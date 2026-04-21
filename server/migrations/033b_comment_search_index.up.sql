DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_content_bigm ON comments USING gin (content gin_bigm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_bigm not available, skipping search index: %', SQLERRM;
END $$;
