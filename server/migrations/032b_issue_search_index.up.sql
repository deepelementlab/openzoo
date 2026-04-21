DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_bigm;
    CREATE INDEX IF NOT EXISTS idx_issues_title_bigm ON issues USING gin (title gin_bigm_ops);
    CREATE INDEX IF NOT EXISTS idx_issues_description_bigm ON issues USING gin (COALESCE(description, '') gin_bigm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_bigm not available, skipping search indexes: %', SQLERRM;
END $$;
