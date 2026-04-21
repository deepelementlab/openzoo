DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_projects_title_bigm ON projects USING gin (LOWER(title) gin_bigm_ops);
    CREATE INDEX IF NOT EXISTS idx_projects_description_bigm ON projects USING gin (LOWER(COALESCE(description, '')) gin_bigm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_bigm not available, skipping search indexes: %', SQLERRM;
END $$;
